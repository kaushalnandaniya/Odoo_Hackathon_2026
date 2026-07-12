"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import {
  cancelTripCore,
  completeTripCore,
  createTripCore,
  dispatchTripCore,
} from "@/lib/trips-engine";

// Trips can be managed by Fleet Managers and (per the brief) Drivers.
const TRIP_ROLES: ("FLEET_MANAGER" | "DRIVER")[] = ["FLEET_MANAGER", "DRIVER"];

export type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  for (const p of ["/trips", "/vehicles", "/drivers", "/dashboard", "/reports"]) {
    revalidatePath(p);
  }
}

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Action failed" };
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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return run(() => createTripCore(parsed.data));
}

export async function dispatchTrip(tripId: string): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  return run(() => dispatchTripCore(tripId));
}

export async function completeTrip(input: unknown): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  const parsed = completeTripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return run(() => completeTripCore(parsed.data));
}

export async function cancelTrip(tripId: string): Promise<ActionResult> {
  await requireRole(TRIP_ROLES);
  return run(() => cancelTripCore(tripId));
}
