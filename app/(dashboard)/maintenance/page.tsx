import { prisma } from "@/lib/prisma";
import { CreateMaintenanceDialog } from "./create-maintenance-dialog";
import { MaintenanceActions } from "./maintenance-actions";
import { VehicleStatus } from "@prisma/client";

export default async function MaintenancePage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE }
  });

  const logs = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Maintenance Logs</h2>
        <CreateMaintenanceDialog vehicles={vehicles} />
      </div>
      
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Service Type</th>
              <th className="p-4 font-medium">Cost</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No maintenance logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-4">{log.vehicle.name} ({log.vehicle.registrationNumber})</td>
                  <td className="p-4">{log.serviceType}</td>
                  <td className="p-4">${log.cost.toFixed(2)}</td>
                  <td className="p-4">{log.scheduledDate ? new Date(log.scheduledDate).toLocaleDateString() : '-'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      log.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <MaintenanceActions logId={log.id} status={log.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
