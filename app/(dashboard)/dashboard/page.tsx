export const revalidate = 60;
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { FleetCharts } from "@/components/dashboard/fleet-charts";
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

  // Execute all KPI queries in parallel
  const [
    distinctTypesRaw,
    distinctRegionsRaw,
    activeVehicles,
    availableVehicles,
    inMaintenance,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    completedTripsCount,
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
    prisma.trip.count({ where: { ...tripWhere, status: TripStatus.COMPLETED } }),
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

  const vehicleStatusData = {
    available: availableVehicles,
    onTrip: activeVehicles,
    inShop: inMaintenance,
    retired: retiredVehicles,
  };

  // ── Chart 1: Top Costs per Vehicle (fuel + maintenance + other expenses) ──
  const vehiclesWithCosts = await prisma.vehicle.findMany({
    where: {
      ...vehicleFilter,
      ...(statusFilter && { status: statusFilter as VehicleStatus }),
    },
    select: {
      registrationNumber: true,
      maintenanceLogs: { select: { cost: true } },
      fuelLogs: { select: { totalCost: true } },
      expenses: { select: { amount: true } },
    }
  });

  const costData = vehiclesWithCosts.map(v => {
    const maintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const fuelCost = v.fuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
    const otherExpenses = v.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      name: v.registrationNumber,
      maintenance: Math.round(maintenanceCost),
      fuel: Math.round(fuelCost),
      expenses: Math.round(otherExpenses),
      total: maintenanceCost + fuelCost + otherExpenses,
    };
  })
  .sort((a, b) => b.total - a.total)
  .slice(0, 5);

  // ── Chart 2: Monthly Revenue vs Total Expenses (last 6 months) ──
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [completedTripsRaw, fuelLogsRaw, expensesRaw, maintenanceRaw, monthlyFuel, monthlyMaint] = await Promise.all([
    prisma.trip.findMany({
      where: { status: TripStatus.COMPLETED, completedAt: { gte: sixMonthsAgo } },
      select: { revenue: true, completedAt: true },
    }),
    prisma.fuelLog.findMany({
      where: { loggedAt: { gte: sixMonthsAgo } },
      select: { totalCost: true, loggedAt: true },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: sixMonthsAgo } },
      select: { amount: true, expenseDate: true },
    }),
    prisma.maintenanceLog.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { cost: true, createdAt: true },
    }),
    // For FleetCharts monthly cost trend
    prisma.fuelLog.findMany({
      where: { loggedAt: { gte: sixMonthsAgo } },
      select: { totalCost: true, loggedAt: true },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.maintenanceLog.findMany({
      where: { completedDate: { gte: sixMonthsAgo } },
      select: { cost: true, completedDate: true },
      orderBy: { completedDate: "asc" },
    }),
  ]);

  // Build month buckets for last 6 months
  const monthLabels: string[] = [];
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const revenueByMonth: Record<string, number> = {};
  const expenseByMonth: Record<string, number> = {};
  monthKeys.forEach(k => { revenueByMonth[k] = 0; expenseByMonth[k] = 0; });

  completedTripsRaw.forEach(t => {
    if (!t.completedAt) return;
    const key = `${t.completedAt.getFullYear()}-${String(t.completedAt.getMonth() + 1).padStart(2, '0')}`;
    if (key in revenueByMonth) revenueByMonth[key] += t.revenue || 0;
  });
  fuelLogsRaw.forEach(f => {
    const key = `${f.loggedAt.getFullYear()}-${String(f.loggedAt.getMonth() + 1).padStart(2, '0')}`;
    if (key in expenseByMonth) expenseByMonth[key] += f.totalCost || 0;
  });
  expensesRaw.forEach(e => {
    const key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, '0')}`;
    if (key in expenseByMonth) expenseByMonth[key] += e.amount || 0;
  });
  maintenanceRaw.forEach(m => {
    const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (key in expenseByMonth) expenseByMonth[key] += m.cost || 0;
  });

  const trendData = monthKeys.map((key, i) => ({
    month: monthLabels[i],
    revenue: Math.round(revenueByMonth[key]),
    expenses: Math.round(expenseByMonth[key]),
  }));

  // ── Chart 3: Trip Status Distribution ──
  const tripStatusData = [
    { name: 'Draft', value: pendingTrips, color: '#6366f1' },
    { name: 'Active', value: activeTrips, color: '#f59e0b' },
    { name: 'Completed', value: completedTripsCount, color: '#10b981' },
  ].filter(d => d.value > 0);

  // ── FleetCharts: Monthly cost trend (fuel + maintenance only) ──
  const monthlyMap: Record<string, { fuel: number; maintenance: number }> = {};
  monthKeys.forEach(k => { monthlyMap[k] = { fuel: 0, maintenance: 0 }; });
  monthlyFuel.forEach(f => {
    const key = `${f.loggedAt.getFullYear()}-${String(f.loggedAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap[key]) monthlyMap[key].fuel += f.totalCost;
  });
  monthlyMaint.forEach(m => {
    if (m.completedDate) {
      const key = `${m.completedDate.getFullYear()}-${String(m.completedDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].maintenance += m.cost;
    }
  });
  const monthlyCostData = monthKeys.map((key, i) => ({
    month: monthLabels[i],
    fuel: Math.round(monthlyMap[key].fuel * 100) / 100,
    maintenance: Math.round(monthlyMap[key].maintenance * 100) / 100,
  }));

  // ── FleetCharts: Fuel efficiency per vehicle ──
  const completedTripsForEfficiency = await prisma.trip.findMany({
    where: {
      status: "COMPLETED",
      endOdometer: { not: null },
      startOdometer: { not: null },
      fuelConsumed: { not: null, gt: 0 },
    },
    select: {
      vehicle: { select: { registrationNumber: true } },
      startOdometer: true,
      endOdometer: true,
      fuelConsumed: true,
    },
  });

  const efficiencyMap: Record<string, { totalKm: number; totalFuel: number }> = {};
  completedTripsForEfficiency.forEach(t => {
    const name = t.vehicle.registrationNumber;
    if (!efficiencyMap[name]) efficiencyMap[name] = { totalKm: 0, totalFuel: 0 };
    efficiencyMap[name].totalKm += (t.endOdometer! - t.startOdometer!);
    efficiencyMap[name].totalFuel += t.fuelConsumed!;
  });
  const fuelEfficiencyData = Object.entries(efficiencyMap)
    .map(([name, v]) => ({
      name,
      kmpl: Math.round((v.totalKm / v.totalFuel) * 100) / 100,
    }))
    .sort((a, b) => b.kmpl - a.kmpl)
    .slice(0, 8);

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

      <FleetCharts
        vehicleStatusData={vehicleStatusData}
        monthlyCostData={monthlyCostData}
        fuelEfficiencyData={fuelEfficiencyData}
      />

      <div className="grid gap-6 md:grid-cols-7 mt-6">
        <div className="md:col-span-4 lg:col-span-5">
          <RecentTrips trips={recentTripsData} />
        </div>
        <div className="md:col-span-3 lg:col-span-2 pl-0 md:pl-6">
          <VehicleStatusBars data={vehicleStatusData} />
        </div>
      </div>

      <DashboardCharts costData={costData} trendData={trendData} tripStatusData={tripStatusData} />
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
