/**
 * Adversarial test pass for the trips engine, run against the live DB.
 * Creates its own test fixtures (TEST- prefixed), cleans up after itself,
 * and never touches seed/demo data.
 *
 * Run: npx tsx scripts/test-engine.ts
 */
import { prisma } from "../lib/prisma";
import {
  cancelTripCore,
  completeTripCore,
  createTripCore,
  dispatchTripCore,
} from "../lib/trips-engine";

let passed = 0;
let failed = 0;

function ok(name: string) {
  passed++;
  console.log(`  PASS  ${name}`);
}
function bad(name: string, detail: string) {
  failed++;
  console.log(`  FAIL  ${name} :: ${detail}`);
}

async function expectThrow(name: string, fn: () => Promise<unknown>, needle?: string) {
  try {
    await fn();
    bad(name, "expected an error but it succeeded");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (needle && !msg.toLowerCase().includes(needle.toLowerCase())) {
      bad(name, `wrong error: "${msg}" (wanted to contain "${needle}")`);
    } else {
      ok(`${name} -> blocked: "${msg}"`);
    }
  }
}

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  console.log("Setting up TEST fixtures...");
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: "TEST-VH-0001",
      name: "TEST-Van",
      type: "Van",
      maxLoadCapacity: 500,
      odometer: 1000,
      acquisitionCost: 100000,
      status: "AVAILABLE",
    },
  });
  const inShopVehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: "TEST-VH-0002",
      name: "TEST-InShop",
      type: "Van",
      maxLoadCapacity: 500,
      odometer: 5000,
      acquisitionCost: 100000,
      status: "IN_SHOP",
    },
  });
  const driver = await prisma.driver.create({
    data: {
      name: "TEST-Driver",
      licenseNumber: "TEST-LIC-0001",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date(Date.now() + 365 * DAY),
      contactNumber: "000",
      safetyScore: 90,
      status: "AVAILABLE",
    },
  });
  const expiredDriver = await prisma.driver.create({
    data: {
      name: "TEST-Expired",
      licenseNumber: "TEST-LIC-0002",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date(Date.now() - 10 * DAY),
      contactNumber: "000",
      safetyScore: 90,
      status: "AVAILABLE",
    },
  });
  const suspendedDriver = await prisma.driver.create({
    data: {
      name: "TEST-Suspended",
      licenseNumber: "TEST-LIC-0003",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date(Date.now() + 365 * DAY),
      contactNumber: "000",
      safetyScore: 20,
      status: "SUSPENDED",
    },
  });

  const base = {
    source: "TEST-A",
    destination: "TEST-B",
    plannedDistance: 100,
  };

  console.log("\n1. Creation-time rules");
  await expectThrow(
    "overloaded cargo (600 > 500)",
    () => createTripCore({ ...base, vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 600 }),
    "exceeds"
  );
  await expectThrow(
    "expired-license driver",
    () => createTripCore({ ...base, vehicleId: vehicle.id, driverId: expiredDriver.id, cargoWeight: 100 }),
    "expired"
  );
  await expectThrow(
    "suspended driver",
    () => createTripCore({ ...base, vehicleId: vehicle.id, driverId: suspendedDriver.id, cargoWeight: 100 }),
    "SUSPENDED"
  );
  await expectThrow(
    "in-shop vehicle",
    () => createTripCore({ ...base, vehicleId: inShopVehicle.id, driverId: driver.id, cargoWeight: 100 }),
    "IN SHOP"
  );

  console.log("\n2. Concurrent double-dispatch race (same vehicle + driver, 2 draft trips)");
  const tripA = await createTripCore({ ...base, vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 100 });
  const tripB = await createTripCore({ ...base, vehicleId: vehicle.id, driverId: driver.id, cargoWeight: 100 });
  const results = await Promise.allSettled([dispatchTripCore(tripA.id), dispatchTripCore(tripB.id)]);
  const wins = results.filter((r) => r.status === "fulfilled").length;
  if (wins === 1) {
    ok(`exactly one dispatch won the race (loser: "${(results.find((r) => r.status === "rejected") as PromiseRejectedResult)?.reason?.message}")`);
  } else {
    bad("double-dispatch race", `${wins} dispatches succeeded, expected exactly 1`);
  }
  const vAfter = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
  const dAfter = await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } });
  if (vAfter.status === "ON_TRIP" && dAfter.status === "ON_TRIP") {
    ok("vehicle and driver are ON_TRIP after dispatch");
  } else {
    bad("post-dispatch statuses", `vehicle=${vAfter.status} driver=${dAfter.status}`);
  }

  const winnerId = results[0].status === "fulfilled" ? tripA.id : tripB.id;
  const loserId = winnerId === tripA.id ? tripB.id : tripA.id;

  console.log("\n3. Dispatch guards on busy resources");
  const tripC = await prisma.trip.create({
    data: {
      tripCode: "TEST-TRIPC",
      ...base,
      vehicleId: vehicle.id,
      driverId: driver.id,
      cargoWeight: 100,
      status: "DRAFT",
    },
  });
  await expectThrow("dispatching a trip whose vehicle is ON_TRIP", () => dispatchTripCore(tripC.id), "not available");
  await expectThrow("dispatching an already-dispatched trip", () => dispatchTripCore(winnerId), "Only Draft");

  console.log("\n4. Completion rules");
  await expectThrow(
    "end odometer below start (900 < 1000)",
    () => completeTripCore({ tripId: winnerId, endOdometer: 900 }),
    "cannot be less"
  );
  await completeTripCore({ tripId: winnerId, endOdometer: 1150, fuelConsumed: 12, revenue: 5000 });
  const vDone = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
  const dDone = await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } });
  const tDone = await prisma.trip.findUniqueOrThrow({ where: { id: winnerId } });
  if (
    vDone.status === "AVAILABLE" &&
    dDone.status === "AVAILABLE" &&
    vDone.odometer === 1150 &&
    tDone.actualDistance === 150
  ) {
    ok("complete restored statuses, updated odometer to 1150, actualDistance 150");
  } else {
    bad(
      "completion state",
      `vehicle=${vDone.status}/${vDone.odometer} driver=${dDone.status} actualDistance=${tDone.actualDistance}`
    );
  }
  await expectThrow("completing a completed trip", () => completeTripCore({ tripId: winnerId, endOdometer: 1200 }), "Only Dispatched");
  await expectThrow("cancelling a completed trip", () => cancelTripCore(winnerId), "cannot be cancelled");

  console.log("\n5. Cancel restores a dispatched trip's resources");
  await dispatchTripCore(tripC.id);
  await cancelTripCore(tripC.id);
  const vCancel = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
  const dCancel = await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } });
  if (vCancel.status === "AVAILABLE" && dCancel.status === "AVAILABLE") {
    ok("cancel restored vehicle and driver to AVAILABLE");
  } else {
    bad("cancel state", `vehicle=${vCancel.status} driver=${dCancel.status}`);
  }
  await expectThrow("cancelling an already-cancelled trip", () => cancelTripCore(tripC.id), "already cancelled");

  console.log("\n6. Suspension mid-trip wins over completion");
  await dispatchTripCore(loserId);
  await prisma.driver.update({ where: { id: driver.id }, data: { status: "SUSPENDED" } });
  await completeTripCore({ tripId: loserId, endOdometer: 1300 });
  const dSusp = await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } });
  if (dSusp.status === "SUSPENDED") {
    ok("driver stayed SUSPENDED after trip completion (status not clobbered)");
  } else {
    bad("suspension override", `driver=${dSusp.status}, expected SUSPENDED`);
  }

  console.log("\nCleaning up TEST fixtures...");
  await prisma.trip.deleteMany({ where: { source: "TEST-A" } });
  await prisma.driver.deleteMany({ where: { licenseNumber: { startsWith: "TEST-LIC" } } });
  await prisma.vehicle.deleteMany({ where: { registrationNumber: { startsWith: "TEST-VH" } } });

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch(async (e) => {
    console.error(e);
    // best-effort cleanup on crash
    await prisma.trip.deleteMany({ where: { source: "TEST-A" } }).catch(() => {});
    await prisma.driver.deleteMany({ where: { licenseNumber: { startsWith: "TEST-LIC" } } }).catch(() => {});
    await prisma.vehicle.deleteMany({ where: { registrationNumber: { startsWith: "TEST-VH" } } }).catch(() => {});
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
