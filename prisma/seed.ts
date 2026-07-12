/**
 * Seed script — demo-critical data. Run: npm run db:seed
 * OWNER: Person 4 refines this (per PLAN.md); Person 1 wrote the base version
 * so the trips engine could be tested.
 *
 * Logins (all passwords: password123):
 *   manager@transitops.in   FLEET_MANAGER
 *   driver@transitops.in    DRIVER
 *   safety@transitops.in    SAFETY_OFFICER
 *   finance@transitops.in   FINANCIAL_ANALYST
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * DAY);

async function main() {
  // Wipe in FK-safe order (idempotent re-seeding)
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      { email: "manager@transitops.in", name: "Meera Kapoor", role: "FLEET_MANAGER", passwordHash },
      { email: "driver@transitops.in", name: "Raven K", role: "DRIVER", passwordHash },
      { email: "safety@transitops.in", name: "Sanjay Rao", role: "SAFETY_OFFICER", passwordHash },
      { email: "finance@transitops.in", name: "Fatima Shaikh", role: "FINANCIAL_ANALYST", passwordHash },
    ],
  });

  const vehicles = await Promise.all(
    [
      { registrationNumber: "MH-01-AB-1234", name: "Van-01", type: "Van", maxLoadCapacity: 500, odometer: 42000, acquisitionCost: 800000, region: "West", status: "AVAILABLE" },
      { registrationNumber: "MH-01-CD-5678", name: "Van-02", type: "Van", maxLoadCapacity: 750, odometer: 30500, acquisitionCost: 950000, region: "West", status: "AVAILABLE" },
      { registrationNumber: "DL-02-EF-9012", name: "Truck-01", type: "Truck", maxLoadCapacity: 5000, odometer: 88000, acquisitionCost: 2500000, region: "North", status: "AVAILABLE" },
      { registrationNumber: "DL-02-GH-3456", name: "Truck-02", type: "Truck", maxLoadCapacity: 8000, odometer: 120500, acquisitionCost: 3200000, region: "North", status: "AVAILABLE" },
      { registrationNumber: "KA-03-IJ-7890", name: "Mini-01", type: "Mini Truck", maxLoadCapacity: 1200, odometer: 15000, acquisitionCost: 600000, region: "South", status: "AVAILABLE" },
      { registrationNumber: "KA-03-KL-2345", name: "Van-03", type: "Van", maxLoadCapacity: 500, odometer: 67000, acquisitionCost: 750000, region: "South", status: "IN_SHOP" },
      { registrationNumber: "TN-04-MN-6789", name: "Truck-03", type: "Truck", maxLoadCapacity: 6000, odometer: 210000, acquisitionCost: 2800000, region: "South", status: "RETIRED" },
      { registrationNumber: "GJ-05-OP-0123", name: "Van-04", type: "Van", maxLoadCapacity: 600, odometer: 22000, acquisitionCost: 850000, region: "West", status: "AVAILABLE" },
    ].map((v) => prisma.vehicle.create({ data: v as never }))
  );
  const byName = Object.fromEntries(vehicles.map((v) => [v.name, v]));

  const drivers = await Promise.all(
    [
      { name: "Arjun Singh", licenseNumber: "DL-1420110012345", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(400), contactNumber: "+91 98200 11111", safetyScore: 92, status: "AVAILABLE" },
      { name: "Priya Nair", licenseNumber: "KA-0520190067890", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(200), contactNumber: "+91 98200 22222", safetyScore: 88, status: "AVAILABLE" },
      { name: "Mohammed Irfan", licenseNumber: "MH-0220150054321", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(30), contactNumber: "+91 98200 33333", safetyScore: 75, status: "AVAILABLE" },
      { name: "Kiran Patel", licenseNumber: "GJ-0120180098765", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(-15), contactNumber: "+91 98200 44444", safetyScore: 81, status: "AVAILABLE" }, // EXPIRED license
      { name: "Vikram Yadav", licenseNumber: "DL-0320200011223", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(300), contactNumber: "+91 98200 55555", safetyScore: 40, status: "SUSPENDED" },
      { name: "Anita Desai", licenseNumber: "TN-0620170033445", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(500), contactNumber: "+91 98200 66666", safetyScore: 95, status: "OFF_DUTY" },
    ].map((d) => prisma.driver.create({ data: d as never }))
  );
  const driverByName = Object.fromEntries(drivers.map((d) => [d.name, d]));

  // Completed trip with history (feeds reports)
  await prisma.trip.create({
    data: {
      tripCode: "TRP-SEED1",
      source: "Mumbai",
      destination: "Pune",
      vehicleId: byName["Van-01"].id,
      driverId: driverByName["Arjun Singh"].id,
      cargoWeight: 420,
      plannedDistance: 150,
      actualDistance: 155,
      status: "COMPLETED",
      startOdometer: 41845,
      endOdometer: 42000,
      fuelConsumed: 14,
      revenue: 18000,
      dispatchedAt: daysFromNow(-3),
      completedAt: daysFromNow(-2),
    },
  });
  // Draft trip ready to dispatch in the demo
  await prisma.trip.create({
    data: {
      tripCode: "TRP-SEED2",
      source: "Delhi",
      destination: "Jaipur",
      vehicleId: byName["Truck-01"].id,
      driverId: driverByName["Priya Nair"].id,
      cargoWeight: 3500,
      plannedDistance: 280,
      status: "DRAFT",
      revenue: 45000,
    },
  });

  // Open maintenance on the IN_SHOP vehicle (consistent state)
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: byName["Van-03"].id,
      serviceType: "Oil Change",
      description: "Scheduled 60k km service",
      cost: 4500,
      status: "OPEN",
      scheduledDate: daysFromNow(-1),
    },
  });
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: byName["Van-01"].id,
      serviceType: "Brake Pads",
      description: "Front brake pads replaced",
      cost: 6200,
      status: "CLOSED",
      scheduledDate: daysFromNow(-20),
      completedDate: daysFromNow(-19),
    },
  });

  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: byName["Van-01"].id, liters: 40, costPerLiter: 96, totalCost: 3840, loggedAt: daysFromNow(-2) },
      { vehicleId: byName["Truck-01"].id, liters: 120, costPerLiter: 90, totalCost: 10800, loggedAt: daysFromNow(-5) },
      { vehicleId: byName["Van-02"].id, liters: 35, costPerLiter: 96, totalCost: 3360, loggedAt: daysFromNow(-7) },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { vehicleId: byName["Van-01"].id, type: "TOLL", amount: 850, description: "Mumbai-Pune expressway", expenseDate: daysFromNow(-2) },
      { vehicleId: byName["Truck-01"].id, type: "PERMIT", amount: 2500, description: "Interstate permit", expenseDate: daysFromNow(-10) },
      { vehicleId: byName["Van-02"].id, type: "PARKING", amount: 300, expenseDate: daysFromNow(-4) },
    ],
  });

  console.log("Seeded: 4 users, 8 vehicles, 6 drivers, 2 trips, 2 maintenance logs, fuel + expenses");
  console.log("Login with e.g. manager@transitops.in / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
