import { prisma } from "./prisma";

/**
 * Core trip lifecycle logic. No auth, no Next.js APIs, throws plain Errors.
 * Server actions in lib/actions/trips.ts wrap these with requireRole + zod +
 * revalidatePath. Tests call these directly.
 *
 * Concurrency safety: status flips are conditional updates (updateMany with a
 * status filter) inside a transaction. Two concurrent dispatches for the same
 * vehicle/driver: the second matches 0 rows and its whole transaction rolls back.
 */

export type CreateTripInput = {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  revenue?: number;
};

export type CompleteTripInput = {
  tripId: string;
  endOdometer: number;
  fuelConsumed?: number;
  revenue?: number;
};

function newTripCode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TRP-${rand}`;
}

export async function createTripCore(data: CreateTripInput) {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
    prisma.driver.findUnique({ where: { id: data.driverId } }),
  ]);
  if (!vehicle) throw new Error("Vehicle not found");
  if (!driver) throw new Error("Driver not found");

  if (data.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(
      `Cargo weight ${data.cargoWeight} kg exceeds ${vehicle.name}'s capacity of ${vehicle.maxLoadCapacity} kg`
    );
  }
  if (vehicle.status !== "AVAILABLE") {
    throw new Error(`Vehicle is ${vehicle.status.replace("_", " ")}, not available`);
  }
  if (driver.status !== "AVAILABLE") {
    throw new Error(`Driver is ${driver.status.replace("_", " ")}, not available`);
  }
  if (driver.licenseExpiryDate <= new Date()) {
    throw new Error("Driver's license has expired");
  }

  return prisma.trip.create({
    data: {
      tripCode: newTripCode(),
      source: data.source,
      destination: data.destination,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeight: data.cargoWeight,
      plannedDistance: data.plannedDistance,
      revenue: data.revenue ?? 0,
      status: "DRAFT",
    },
  });
}

export async function dispatchTripCore(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DRAFT") {
      throw new Error(`Only Draft trips can be dispatched (this one is ${trip.status})`);
    }
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
      // Re-read: the snapshot from before the update may be stale under a race.
      const current = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
      throw new Error(
        `Vehicle ${trip.vehicle.name} is not available (${(current?.status ?? "UNKNOWN").replace("_", " ")})`
      );
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

    return tx.trip.update({
      where: { id: tripId },
      data: {
        status: "DISPATCHED",
        dispatchedAt: new Date(),
        startOdometer: trip.vehicle.odometer,
      },
    });
  });
}

export async function completeTripCore(input: CompleteTripInput) {
  const { tripId, endOdometer, fuelConsumed, revenue } = input;
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DISPATCHED") {
      throw new Error("Only Dispatched trips can be completed");
    }
    if (trip.startOdometer !== null && endOdometer < trip.startOdometer) {
      throw new Error(
        `End odometer (${endOdometer}) cannot be less than start odometer (${trip.startOdometer})`
      );
    }

    const updated = await tx.trip.update({
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

    // Only flip back entities still marked ON_TRIP. If a safety officer suspended
    // the driver mid-trip (or the vehicle went IN_SHOP), that status wins.
    await tx.vehicle.updateMany({
      where: { id: trip.vehicleId, status: "ON_TRIP" },
      data: { status: "AVAILABLE", odometer: endOdometer },
    });
    await tx.driver.updateMany({
      where: { id: trip.driverId, status: "ON_TRIP" },
      data: { status: "AVAILABLE" },
    });

    return updated;
  });
}

export async function cancelTripCore(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "COMPLETED") throw new Error("Completed trips cannot be cancelled");
    if (trip.status === "CANCELLED") throw new Error("Trip is already cancelled");

    const updated = await tx.trip.update({
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

    return updated;
  });
}
