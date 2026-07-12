import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateMaintenanceDialog } from "./create-maintenance-dialog";
import { MaintenanceActions } from "./maintenance-actions";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string; status?: string }>;
}) {
  const session = await auth();
  const canManage = session?.user.role === "FLEET_MANAGER";
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.vehicleId) where.vehicleId = params.vehicleId;
  if (params.status) where.status = params.status;

  const [logs, vehicles] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where,
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Maintenance Logs</h2>
        {canManage && <CreateMaintenanceDialog vehicles={vehicles} />}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Service Type</th>
              <th className="p-4 font-medium">Description</th>
              <th className="p-4 font-medium text-right">Cost</th>
              <th className="p-4 font-medium">Scheduled</th>
              <th className="p-4 font-medium">Completed</th>
              <th className="p-4 font-medium">Status</th>
              {canManage && <th className="p-4 font-medium text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="p-4 text-center text-muted-foreground">
                  No maintenance logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-4 font-medium">{log.vehicle.name}</td>
                  <td className="p-4">{log.serviceType}</td>
                  <td className="p-4 max-w-[200px] truncate">{log.description || "—"}</td>
                  <td className="p-4 text-right">${log.cost.toFixed(2)}</td>
                  <td className="p-4">{log.scheduledDate ? new Date(log.scheduledDate).toLocaleDateString() : "—"}</td>
                  <td className="p-4">{log.completedDate ? new Date(log.completedDate).toLocaleDateString() : "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      log.status === "OPEN" ? "bg-yellow-100 text-yellow-800" :
                      log.status === "CLOSED" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4 text-right">
                      <MaintenanceActions logId={log.id} status={log.status} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
