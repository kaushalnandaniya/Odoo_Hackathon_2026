export const revalidate = 60;
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { PendingUsers } from "@/components/dashboard/pending-users";
import { VehicleStatus, DriverStatus, TripStatus } from "@prisma/client";
import { RecentTrips } from "@/components/dashboard/recent-trips";
import { VehicleStatusBars } from "@/components/dashboard/vehicle-status-bars";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";

export default async function DashboardPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isAdmin = session?.user?.role === "FLEET_MANAGER";

  const type = typeof searchParams?.type === 'string' ? searchParams.type : undefined;
  const statusFilter = typeof searchParams?.status === 'string' ? searchParams.status.toUpperCase() : undefined;
  const region = typeof searchParams?.region === 'string' ? searchParams.region : undefined;

  const vehicleFilter = {
    ...(type && { type: { equals: type, mode: "insensitive" as const } }),
    ...(region && { region: { equals: region, mode: "insensitive" as const } }),
  };

  const tripWhere = {
    vehicle: {
      ...vehicleFilter,
      ...(statusFilter && { status: statusFilter as VehicleStatus }),
    }
  };

  // Execute all Prisma queries in parallel
  const [
    distinctTypesRaw,
    distinctRegionsRaw,
    activeVehicles,
    availableVehicles,
    inMaintenance,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    availableDrivers,
    onTripDrivers,
  ] = await Promise.all([
    prisma.vehicle.findMany({ select: { type: true }, distinct: ['type'] }),
    prisma.vehicle.findMany({ select: { region: true }, distinct: ['region'] }),
    statusFilter && statusFilter !== 'ON_TRIP' ? 0 : prisma.vehicle.count({ where: { ...vehicleFilter, status: VehicleStatus.ON_TRIP } }),
    statusFilter && statusFilter !== 'AVAILABLE' ? 0 : prisma.vehicle.count({ where: { ...vehicleFilter, status: VehicleStatus.AVAILABLE } }),
    statusFilter && statusFilter !== 'IN_SHOP' ? 0 : prisma.vehicle.count({ where: { ...vehicleFilter, status: VehicleStatus.IN_SHOP } }),
    statusFilter && statusFilter !== 'RETIRED' ? 0 : prisma.vehicle.count({ where: { ...vehicleFilter, status: VehicleStatus.RETIRED } }),
    prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DRAFT } }),
    prisma.driver.count({ where: { status: DriverStatus.AVAILABLE } }),
    prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
  ]);

  const distinctTypes = distinctTypesRaw.map(t => t.type).filter(Boolean);
  const distinctRegions = distinctRegionsRaw.map(r => r.region).filter(Boolean) as string[];

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

  // Data for Vehicle Status Component
  const vehicleStatusData = {
    available: availableVehicles,
    onTrip: activeVehicles,
    inShop: inMaintenance,
    retired: retiredVehicles
  };

  // Fetch all vehicles with their related maintenance and fuel logs for the Cost Bar Chart
  const vehiclesWithCosts = await prisma.vehicle.findMany({
    where: {
      ...vehicleFilter,
      ...(statusFilter && { status: statusFilter as VehicleStatus }),
    },
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

  // Fetch recent trips
  const recentTripsData = await prisma.trip.findMany({
    where: tripWhere,
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
    }
  });
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {isAdmin && <PendingUsersFetch />}
      </div>

      <DashboardFilters types={distinctTypes} regions={distinctRegions} />

      <KpiCards metrics={metrics} />
      
      <div className="grid gap-6 md:grid-cols-7 mt-6">
        <div className="md:col-span-4 lg:col-span-5">
          <RecentTrips trips={recentTripsData} />
        </div>
        <div className="md:col-span-3 lg:col-span-2 pl-0 md:pl-6">
          <VehicleStatusBars data={vehicleStatusData} />
        </div>
      </div>
      
      {/* Existing Cost Bar Chart */}
      <DashboardCharts costData={costData} />
    </div>
  );
}

async function PendingUsersFetch() {
  const pendingUsers = await prisma.user.findMany({
    where: { role: "PENDING" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return <PendingUsers users={pendingUsers} />;
}
