import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Users (one per role)
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "manager@transitops.in" },
      update: { passwordHash: hash("password123"), role: "FLEET_MANAGER" },
      create: { email: "manager@transitops.in", name: "Rajesh Kumar", passwordHash: hash("password123"), role: "FLEET_MANAGER" },
    }),
    prisma.user.upsert({
      where: { email: "driver@transitops.in" },
      update: { passwordHash: hash("password123"), role: "DRIVER" },
      create: { email: "driver@transitops.in", name: "Vikram Singh", passwordHash: hash("password123"), role: "DRIVER" },
    }),
    prisma.user.upsert({
      where: { email: "safety@transitops.in" },
      update: { passwordHash: hash("password123"), role: "SAFETY_OFFICER" },
      create: { email: "safety@transitops.in", name: "Anita Sharma", passwordHash: hash("password123"), role: "SAFETY_OFFICER" },
    }),
    prisma.user.upsert({
      where: { email: "finance@transitops.in" },
      update: { passwordHash: hash("password123"), role: "FINANCIAL_ANALYST" },
      create: { email: "finance@transitops.in", name: "Priya Patel", passwordHash: hash("password123"), role: "FINANCIAL_ANALYST" },
    }),
    // Extra drivers for the driver records below
    prisma.user.upsert({
      where: { email: "driver2@transitops.in" },
      update: { passwordHash: hash("password123"), role: "DRIVER" },
      create: { email: "driver2@transitops.in", name: "Suresh Reddy", passwordHash: hash("password123"), role: "DRIVER" },
    }),
    prisma.user.upsert({
      where: { email: "driver3@transitops.in" },
      update: { passwordHash: hash("password123"), role: "DRIVER" },
      create: { email: "driver3@transitops.in", name: "Amit Verma", passwordHash: hash("password123"), role: "DRIVER" },
    }),
  ]);

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNumber: "MH-01-AB-1234" },
      update: {},
      create: { registrationNumber: "MH-01-AB-1234", name: "Tata Ace", type: "Mini Truck", maxLoadCapacity: 750, odometer: 45230, acquisitionCost: 450000, region: "Mumbai", status: "AVAILABLE" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "MH-02-CD-5678" },
      update: {},
      create: { registrationNumber: "MH-02-CD-5678", name: "Ashok Leyland Dost", type: "Light Truck", maxLoadCapacity: 2000, odometer: 89120, acquisitionCost: 850000, region: "Mumbai", status: "ON_TRIP" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "GJ-03-EF-9012" },
      update: {},
      create: { registrationNumber: "GJ-03-EF-9012", name: "Mahindra Bolero Pickup", type: "Pickup", maxLoadCapacity: 1200, odometer: 62300, acquisitionCost: 650000, region: "Ahmedabad", status: "AVAILABLE" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "KA-04-GH-3456" },
      update: {},
      create: { registrationNumber: "KA-04-GH-3456", name: "BharatBenz 914", type: "Heavy Truck", maxLoadCapacity: 16000, odometer: 124500, acquisitionCost: 2800000, region: "Bangalore", status: "IN_SHOP" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "TN-05-IJ-7890" },
      update: {},
      create: { registrationNumber: "TN-05-IJ-7890", name: "Eicher Pro 2095", type: "Heavy Truck", maxLoadCapacity: 21000, odometer: 210300, acquisitionCost: 3500000, region: "Chennai", status: "RETIRED" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "DL-06-KL-1234" },
      update: {},
      create: { registrationNumber: "DL-06-KL-1234", name: "Maruti Suzuki Super Carry", type: "Mini Truck", maxLoadCapacity: 800, odometer: 18400, acquisitionCost: 520000, region: "Delhi", status: "AVAILABLE" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "MH-07-MN-5678" },
      update: {},
      create: { registrationNumber: "MH-07-MN-5678", name: "Tata 407", type: "Light Truck", maxLoadCapacity: 4500, odometer: 75600, acquisitionCost: 1200000, region: "Mumbai", status: "ON_TRIP" },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: "UP-08-OP-9012" },
      update: {},
      create: { registrationNumber: "UP-08-OP-9012", name: "Force Traveller", type: "Light Truck", maxLoadCapacity: 2500, odometer: 32100, acquisitionCost: 980000, region: "Lucknow", status: "AVAILABLE" },
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2021-MH-001" },
      update: {},
      create: { userId: users[1].id, name: "Vikram Singh", licenseNumber: "DL-2021-MH-001", licenseCategory: "Light Commercial", licenseExpiryDate: new Date("2027-06-15"), contactNumber: "+91-9876543210", safetyScore: 88, status: "AVAILABLE" },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2020-MH-002" },
      update: {},
      create: { userId: users[4].id, name: "Suresh Reddy", licenseNumber: "DL-2020-MH-002", licenseCategory: "Heavy Commercial", licenseExpiryDate: new Date("2025-12-31"), contactNumber: "+91-8765432109", safetyScore: 72, status: "ON_TRIP" },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2022-GJ-003" },
      update: {},
      create: { userId: users[5].id, name: "Amit Verma", licenseNumber: "DL-2022-GJ-003", licenseCategory: "Light Commercial", licenseExpiryDate: new Date("2023-03-20"), contactNumber: "+91-7654321098", safetyScore: 45, status: "SUSPENDED" },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2023-KA-004" },
      update: {},
      create: { name: "Deepa Nair", licenseNumber: "DL-2023-KA-004", licenseCategory: "Heavy Commercial", licenseExpiryDate: new Date("2028-09-10"), contactNumber: "+91-6543210987", safetyScore: 95, status: "AVAILABLE" },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2022-TN-005" },
      update: {},
      create: { name: "Karthik Pandian", licenseNumber: "DL-2022-TN-005", licenseCategory: "Medium Commercial", licenseExpiryDate: new Date("2024-01-15"), contactNumber: "+91-5432109876", safetyScore: 67, status: "AVAILABLE" },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: "DL-2021-DL-006" },
      update: {},
      create: { name: "Rohit Mehta", licenseNumber: "DL-2021-DL-006", licenseCategory: "Light Commercial", licenseExpiryDate: new Date("2026-11-30"), contactNumber: "+91-4321098765", safetyScore: 81, status: "OFF_DUTY" },
    }),
  ]);

  const trips = await Promise.all([
    prisma.trip.upsert({
      where: { tripCode: "TRP-001" },
      update: {},
      create: { tripCode: "TRP-001", source: "Mumbai", destination: "Pune", vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeight: 500, plannedDistance: 150, status: "COMPLETED", startOdometer: 45000, endOdometer: 45160, fuelConsumed: 18, revenue: 12000, dispatchedAt: new Date("2026-06-10"), completedAt: new Date("2026-06-10") },
    }),
    prisma.trip.upsert({
      where: { tripCode: "TRP-002" },
      update: {},
      create: { tripCode: "TRP-002", source: "Mumbai", destination: "Ahmedabad", vehicleId: vehicles[1].id, driverId: drivers[1].id, cargoWeight: 1800, plannedDistance: 550, status: "DISPATCHED", startOdometer: 88500, fuelConsumed: 55, revenue: 45000, dispatchedAt: new Date("2026-07-11") },
    }),
    prisma.trip.upsert({
      where: { tripCode: "TRP-003" },
      update: {},
      create: { tripCode: "TRP-003", source: "Bangalore", destination: "Chennai", vehicleId: vehicles[3].id, driverId: drivers[3].id, cargoWeight: 12000, plannedDistance: 350, status: "DRAFT", revenue: 80000 },
    }),
    prisma.trip.upsert({
      where: { tripCode: "TRP-004" },
      update: {},
      create: { tripCode: "TRP-004", source: "Delhi", destination: "Lucknow", vehicleId: vehicles[5].id, driverId: drivers[4].id, cargoWeight: 700, plannedDistance: 500, status: "COMPLETED", startOdometer: 17800, endOdometer: 18320, fuelConsumed: 42, revenue: 35000, dispatchedAt: new Date("2026-06-28"), completedAt: new Date("2026-06-29") },
    }),
    prisma.trip.upsert({
      where: { tripCode: "TRP-005" },
      update: {},
      create: { tripCode: "TRP-005", source: "Mumbai", destination: "Pune", vehicleId: vehicles[6].id, driverId: drivers[5].id, cargoWeight: 3000, plannedDistance: 150, status: "DISPATCHED", startOdometer: 75400, fuelConsumed: 20, revenue: 22000, dispatchedAt: new Date("2026-07-12") },
    }),
  ]);

  // Fuel logs
  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, tripId: trips[0].id, liters: 18, costPerLiter: 1.15, totalCost: 20.70, loggedAt: new Date("2026-06-10") } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[1].id, tripId: trips[1].id, liters: 55, costPerLiter: 1.12, totalCost: 61.60, loggedAt: new Date("2026-07-11") } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[5].id, tripId: trips[3].id, liters: 42, costPerLiter: 1.18, totalCost: 49.56, loggedAt: new Date("2026-06-28") } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[6].id, tripId: trips[4].id, liters: 20, costPerLiter: 1.10, totalCost: 22.00, loggedAt: new Date("2026-07-12") } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, liters: 25, costPerLiter: 1.14, totalCost: 28.50, loggedAt: new Date("2026-06-25") } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[2].id, liters: 30, costPerLiter: 1.13, totalCost: 33.90, loggedAt: new Date("2026-07-01") } }),
  ]);

  // Maintenance logs
  await Promise.all([
    prisma.maintenanceLog.create({ data: { vehicleId: vehicles[3].id, serviceType: "Oil Change", description: "Scheduled oil and filter change", cost: 250, status: "OPEN", scheduledDate: new Date("2026-07-15") } }),
    prisma.maintenanceLog.create({ data: { vehicleId: vehicles[0].id, serviceType: "Brake Inspection", description: "Rear brake pad replacement", cost: 180, status: "CLOSED", scheduledDate: new Date("2026-06-20"), completedDate: new Date("2026-06-20") } }),
    prisma.maintenanceLog.create({ data: { vehicleId: vehicles[2].id, serviceType: "Tire Rotation", description: "All 4 tires rotated and balanced", cost: 120, status: "CLOSED", scheduledDate: new Date("2026-06-15"), completedDate: new Date("2026-06-15") } }),
    prisma.maintenanceLog.create({ data: { vehicleId: vehicles[5].id, serviceType: "AC Service", description: "AC gas refill and cleaning", cost: 200, status: "OPEN", scheduledDate: new Date("2026-07-20") } }),
  ]);

  // Expenses
  await Promise.all([
    prisma.expense.create({ data: { vehicleId: vehicles[0].id, type: "TOLL", amount: 350, description: "Mumbai-Pune toll both ways", expenseDate: new Date("2026-06-10") } }),
    prisma.expense.create({ data: { vehicleId: vehicles[1].id, type: "TOLL", amount: 1200, description: "Mumbai-Ahmedabad highway toll", expenseDate: new Date("2026-07-11") } }),
    prisma.expense.create({ data: { vehicleId: vehicles[3].id, type: "INSURANCE", amount: 15000, description: "Annual comprehensive insurance", expenseDate: new Date("2026-04-01") } }),
    prisma.expense.create({ data: { vehicleId: vehicles[5].id, type: "PARKING", amount: 200, description: "Warehouse parking fee", expenseDate: new Date("2026-06-28") } }),
    prisma.expense.create({ data: { vehicleId: vehicles[0].id, type: "PERMIT", amount: 5000, description: "National permit renewal", expenseDate: new Date("2026-05-15") } }),
    prisma.expense.create({ data: { vehicleId: vehicles[6].id, type: "TOLL", amount: 350, description: "Mumbai-Pune toll", expenseDate: new Date("2026-07-12") } }),
  ]);

  console.log("Seed complete: 6 users, 8 vehicles, 6 drivers, 5 trips, 6 fuel logs, 4 maintenance logs, 6 expenses");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
