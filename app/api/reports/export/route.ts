import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    const lines = ["Registration,Name,Distance(km),Fuel Efficiency(km/L),Operational Cost($),Revenue($),ROI(%)"];

    vehicles.forEach(v => {
      const totalDistance = v.trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
      const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const totalFuelLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
      const totalFuelCost = v.fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
      const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const totalOtherExpenses = v.expenses.reduce((sum, e) => sum + e.amount, 0);

      const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
      const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : "N/A";
      
      const roi = v.acquisitionCost > 0 
        ? (((totalRevenue - operationalCost) / v.acquisitionCost) * 100).toFixed(2)
        : "N/A";

      lines.push(`${v.registrationNumber},"${v.name}",${totalDistance.toFixed(1)},${fuelEfficiency},${operationalCost.toFixed(2)},${totalRevenue.toFixed(2)},${roi}`);
    });

    const csvString = lines.join("\n");

    return new NextResponse(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="fleet_report.csv"',
      },
    });
  } catch (error) {
    console.error("CSV Export error", error);
    return new NextResponse("Error generating CSV", { status: 500 });
  }
}
