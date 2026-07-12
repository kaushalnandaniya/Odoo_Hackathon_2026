import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { PendingUsers } from "@/components/dashboard/pending-users";
import { VehicleStatus, DriverStatus, TripStatus } from "@prisma/client";

export default async function DashboardPage() {
  // Execute all Prisma count queries in parallel for performance
  const [
    activeVehicles,
    availableVehicles,
    inMaintenance,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    availableDrivers,
    onTripDrivers,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.RETIRED } }),
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { status: TripStatus.DRAFT } }),
    prisma.driver.count({ where: { status: DriverStatus.AVAILABLE } }),
    prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
  ]);

  const totalNonRetired = activeVehicles + availableVehicles + inMaintenance;
  const fleetUtilization = totalNonRetired > 0 
    ? ((activeVehicles / totalNonRetired) * 100).toFixed(1) 
    : "0.0";

  const metrics = {
    activeVehicles,
    availableVehicles,
    inMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty: availableDrivers + onTripDrivers,
    fleetUtilization,
  };

  // Data for the Donut Chart
  const statusData = [
    { name: "Available", value: availableVehicles, color: "#10b981" }, // Emerald 500
    { name: "On Trip", value: activeVehicles, color: "#3b82f6" },     // Blue 500
    { name: "In Shop", value: inMaintenance, color: "#f59e0b" },     // Amber 500
  ];

  // Fetch all vehicles with their related maintenance and fuel logs for the Cost Bar Chart
  const vehiclesWithCosts = await prisma.vehicle.findMany({
    select: {
      registrationNumber: true,
      maintenanceLogs: {
        select: { cost: true }
      },
      fuelLogs: {
        select: { totalCost: true }
      }
    }
  });

  // Calculate costs and sort to find top 5 most expensive vehicles
  const costData = vehiclesWithCosts.map(v => {
    const maintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const fuelCost = v.fuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
    return {
      name: v.registrationNumber,
      maintenance: maintenanceCost,
      fuel: fuelCost,
      total: maintenanceCost + fuelCost
    };
  })
  .sort((a, b) => b.total - a.total)
  .slice(0, 5); // Take top 5

  // Fetch pending users for the admin approval section
  const pendingUsers = await prisma.user.findMany({
    where: { role: "PENDING" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <KpiCards metrics={metrics} />
      <DashboardCharts statusData={statusData} costData={costData} />
      
      {/* Admin Role Assignment Section */}
      <PendingUsers users={pendingUsers} />
    </div>
  );
}
