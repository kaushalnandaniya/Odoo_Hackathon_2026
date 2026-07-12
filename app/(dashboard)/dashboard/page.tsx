import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { PendingUsers } from "@/components/dashboard/pending-users";
import { VehicleStatus, DriverStatus, TripStatus } from "@prisma/client";
import { RecentTrips } from "@/components/dashboard/recent-trips";
import { VehicleStatusBars } from "@/components/dashboard/vehicle-status-bars";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "FLEET_MANAGER";
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

  // Data for Vehicle Status Component
  const vehicleStatusData = {
    available: availableVehicles,
    onTrip: activeVehicles,
    inShop: inMaintenance,
    retired: retiredVehicles
  };

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

<<<<<<< Updated upstream
=======
  // Fetch pending users for the admin approval section
  const pendingUsers = await prisma.user.findMany({
    where: { role: "PENDING" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch recent trips
  const recentTripsData = await prisma.trip.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
    }
  });

>>>>>>> Stashed changes
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Filter Bar (UI Mockup) */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Filters</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Vehicle Type:</Label>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="truck">Trucks</SelectItem>
                <SelectItem value="van">Vans</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Region:</Label>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-32 text-xs bg-background/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
      
      {/* Admin Role Assignment Section — only visible to Fleet Managers */}
      {isAdmin && <PendingUsersFetch />}
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
