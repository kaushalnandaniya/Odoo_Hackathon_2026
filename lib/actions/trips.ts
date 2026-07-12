"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

// Trips can be managed by Fleet Managers and (per the brief) Drivers.
const TRIP_ROLES: ("FLEET_MANAGER" | "DRIVER")[] = ["FLEET_MANAGER", "DRIVER"];

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function refresh() {
  for (const p of ["/trips", "/vehicles", "/drivers", "/dashboard", "/reports"]) {
    revalidatePath(p);
  }
}

const createTripSchema = z.object({
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  vehicleId: z.string().uuid("Select a vehicle"),
  driverId: z.string().uuid("Select a driver"),
  cargoWeight: z.coerce.number().positive("Cargo weight must be > 0"),
  plannedDistance: z.coerce.number().positive("Planned distance must be > 0"),
  revenue: z.coerce.number().min(0).optional().default(0),
});

const completeTripSchema = z.object({
  tripId: z.string().uuid(),
  endOdometer: z.coerce.number().min(0),
  fuelConsumed: z.coerce.number().min(0).optional(),
  revenue: z.coerce.number().min(0).optional(),
});

function newTripCode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TRP-${rand}`;
}

/** Vehicles eligible for dispatch: AVAILABLE only (never RETIRED / IN_SHOP / ON_TRIP). */
export async function getEligibleVehicles(minCapacity?: number) {
  await requireRole();
  return prisma.vehicle.findMany({
    where: {
      status: "AVAILABLE",
      ...(minCapacity ? { maxLoadCapacity: { gte: minCapacity } } : {}),
    },
    orderBy: { name: "asc" },
  });
}

/** Drivers eligible for dispatch: AVAILABLE, license valid, not suspended. */
export async function getEligibleDrivers() {
  await requireRole();
  return prisma.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiryDate: { gt: new Date() } },
    orderBy: { name: "asc" },
  });
}

export async function createTrip(input: unknown): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  const parsed = createTripSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const data = parsed.data;

  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
    prisma.driver.findUnique({ where: { id: data.driverId } }),
  ]);
  if (!vehicle) return fail("Vehicle not found");
  if (!driver) return fail("Driver not found");

  // Business rules checked at creation (and re-checked at dispatch):
  if (data.cargoWeight > vehicle.maxLoadCapacity) {
    return fail(
      `Cargo weight ${data.cargoWeight} kg exceeds ${vehicle.name}'s capacity of ${vehicle.maxLoadCapacity} kg`
    );
  }
  if (vehicle.status !== "AVAILABLE") return fail(`Vehicle is ${vehicle.status.replace("_", " ")}, not available`);
  if (driver.status !== "AVAILABLE") return fail(`Driver is ${driver.status.replace("_", " ")}, not available`);
  if (driver.licenseExpiryDate <= new Date()) return fail("Driver's license has expired");

  await prisma.trip.create({
    data: {
      tripCode: newTripCode(),
      source: data.source,
      destination: data.destination,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeight: data.cargoWeight,
      plannedDistance: data.plannedDistance,
      revenue: data.revenue,
      status: "DRAFT",
    },
  });
  refresh();
  return { ok: true };
}

/**
 * Dispatch: the critical transition. All checks re-run INSIDE the transaction,
 * and the vehicle/driver status flips use conditional updates (updateMany with a
 * status filter) so concurrent dispatches cannot double-book — the second one
 * matches 0 rows and the whole transaction rolls back.
 */
export async function dispatchTrip(tripId: string): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });
      if (!trip) throw new Error("Trip not found");
      if (trip.status !== "DRAFT") throw new Error(`Only Draft trips can be dispatched (this one is ${trip.status})`);
      if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) {
        throw new Error(
          `Cargo ${trip.cargoWeight} kg exceeds vehicle capacity ${trip.vehicle.maxLoadCapacity} kg`
        );
      }

      const vehicleFlip = await tx.vehicle.updateMany({
        where: { id: trip.vehicleId, status: "AVAILABLE" },
        data: { status: "ON_TRIP" },
      });
      if (vehicleFlip.count === 0) {
        throw new Error(`Vehicle ${trip.vehicle.name} is not available (${trip.vehicle.status.replace("_", " ")})`);
      }

      const driverFlip = await tx.driver.updateMany({
        where: {
          id: trip.driverId,
          status: "AVAILABLE",
          licenseExpiryDate: { gt: new Date() },
        },
        data: { status: "ON_TRIP" },
      });
      if (driverFlip.count === 0) {
        throw new Error(
          `Driver ${trip.driver.name} cannot be dispatched (unavailable, suspended, or license expired)`
        );
      }

      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "DISPATCHED",
          dispatchedAt: new Date(),
          startOdometer: trip.vehicle.odometer,
        },
      });
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Dispatch failed");
  }
}

/** Complete: trip records final odometer/fuel/revenue; vehicle + driver return to AVAILABLE. */
export async function completeTrip(input: unknown): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  const parsed = completeTripSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { tripId, endOdometer, fuelConsumed, revenue } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new Error("Trip not found");
      if (trip.status !== "DISPATCHED") throw new Error("Only Dispatched trips can be completed");
      if (trip.startOdometer !== null && endOdometer < trip.startOdometer) {
        throw new Error(`End odometer (${endOdometer}) cannot be less than start odometer (${trip.startOdometer})`);
      }

      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          endOdometer,
          actualDistance: trip.startOdometer !== null ? endOdometer - trip.startOdometer : null,
          ...(fuelConsumed !== undefined ? { fuelConsumed } : {}),
          ...(revenue !== undefined ? { revenue } : {}),
        },
      });

      // Only flip back entities still marked ON_TRIP — if a safety officer suspended
      // the driver mid-trip (or the vehicle went IN_SHOP), that status wins.
      await tx.vehicle.updateMany({
        where: { id: trip.vehicleId, status: "ON_TRIP" },
        data: { status: "AVAILABLE", odometer: endOdometer },
      });
      await tx.driver.updateMany({
        where: { id: trip.driverId, status: "ON_TRIP" },
        data: { status: "AVAILABLE" },
      });
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Completion failed");
  }
}

/** Cancel: Draft or Dispatched → Cancelled; a dispatched trip's vehicle + driver are restored. */
export async function cancelTrip(tripId: string): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new Error("Trip not found");
      if (trip.status === "COMPLETED") throw new Error("Completed trips cannot be cancelled");
      if (trip.status === "CANCELLED") throw new Error("Trip is already cancelled");

      await tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED" },
      });

      if (trip.status === "DISPATCHED") {
        await tx.vehicle.updateMany({
          where: { id: trip.vehicleId, status: "ON_TRIP" },
          data: { status: "AVAILABLE" },
        });
        await tx.driver.updateMany({
          where: { id: trip.driverId, status: "ON_TRIP" },
          data: { status: "AVAILABLE" },
        });
      }
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Cancellation failed");
  }
}
