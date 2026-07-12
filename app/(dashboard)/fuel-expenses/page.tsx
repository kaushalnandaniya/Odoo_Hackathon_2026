export const revalidate = 60;
import { prisma } from "@/lib/prisma";
import { LogFuelDialog } from "./log-fuel-dialog";
import { LogExpenseDialog } from "./log-expense-dialog";

export default async function FuelExpensesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" }
  });

  const [fuelLogs, expenses] = await Promise.all([
    prisma.fuelLog.findMany({
      include: { vehicle: true },
      orderBy: { loggedAt: "desc" }
    }),
    prisma.expense.findMany({
      include: { vehicle: true },
      orderBy: { expenseDate: "desc" }
    })
  ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Fuel & Expenses</h2>
        <div className="flex gap-2">
          <LogExpenseDialog vehicles={vehicles} />
          <LogFuelDialog vehicles={vehicles} />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fuel Logs */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Fuel Logs</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-4 font-medium">Vehicle</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Liters</th>
                  <th className="p-4 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No fuel logs found.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="p-4">{log.vehicle.registrationNumber}</td>
                      <td className="p-4">{new Date(log.loggedAt).toLocaleDateString()}</td>
                      <td className="p-4">{log.liters} L</td>
                      <td className="p-4">${log.totalCost.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Other Expenses</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-4 font-medium">Vehicle</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b">
                      <td className="p-4">{expense.vehicle.registrationNumber}</td>
                      <td className="p-4">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td className="p-4">{expense.type}</td>
                      <td className="p-4">${expense.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
