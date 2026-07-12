import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: {
        where: { status: 'COMPLETED' },
        select: { actualDistance: true, revenue: true }
      },
      fuelLogs: {
        select: { liters: true, totalCost: true }
      },
      maintenanceLogs: {
        select: { cost: true }
      },
      expenses: {
        select: { amount: true }
      }
    }
  });

  const reportData = vehicles.map(v => {
    const totalDistance = v.trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
    const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    
    const totalFuelLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    const totalFuelCost = v.fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
    
    const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalOtherExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);

    const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : "N/A";
    
    const roi = v.acquisitionCost > 0 
      ? (((totalRevenue - operationalCost) / v.acquisitionCost) * 100).toFixed(2) + "%"
      : "N/A";

    return {
      id: v.id,
      reg: v.registrationNumber,
      name: v.name,
      distance: totalDistance,
      revenue: totalRevenue,
      fuelEfficiency,
      operationalCost,
      roi
    };
  });

  // Calculate fleet utilization
  const totalNonRetired = vehicles.filter(v => v.status !== 'RETIRED').length;
  const activeVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const fleetUtilization = totalNonRetired > 0 
    ? ((activeVehicles / totalNonRetired) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <a 
          href="/api/reports/export" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Export CSV
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Fleet Utilization</h3>
          <div className="text-2xl font-bold mt-2">{fleetUtilization}%</div>
          <p className="text-xs text-muted-foreground mt-1">{activeVehicles} of {totalNonRetired} vehicles active</p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium text-right">Distance (km)</th>
              <th className="p-4 font-medium text-right">Fuel Efficiency (km/L)</th>
              <th className="p-4 font-medium text-right">Op Cost ($)</th>
              <th className="p-4 font-medium text-right">Revenue ($)</th>
              <th className="p-4 font-medium text-right">ROI</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No data available.
                </td>
              </tr>
            ) : (
              reportData.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-4">{row.name} ({row.reg})</td>
                  <td className="p-4 text-right">{row.distance.toFixed(1)}</td>
                  <td className="p-4 text-right">{row.fuelEfficiency}</td>
                  <td className="p-4 text-right">${row.operationalCost.toFixed(2)}</td>
                  <td className="p-4 text-right text-green-600">${row.revenue.toFixed(2)}</td>
                  <td className="p-4 text-right font-medium">{row.roi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
