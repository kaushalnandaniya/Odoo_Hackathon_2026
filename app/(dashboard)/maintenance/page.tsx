import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CreateMaintenanceDialog } from "./create-maintenance-dialog";
import { MaintenanceActions } from "./maintenance-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "default",
  CLOSED: "secondary",
};

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Track vehicle repairs, servicing, and shop status.
          </p>
        </div>
        {canManage && <CreateMaintenanceDialog vehicles={vehicles} />}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Cost ($)</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No maintenance logs found.
              </TableCell>
            </TableRow>
          )}
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.vehicle.name}</TableCell>
              <TableCell>{log.serviceType}</TableCell>
              <TableCell className="max-w-[200px] truncate">{log.description || "—"}</TableCell>
              <TableCell className="text-right">${log.cost.toFixed(2)}</TableCell>
              <TableCell>{log.scheduledDate ? new Date(log.scheduledDate).toLocaleDateString() : "—"}</TableCell>
              <TableCell>{log.completedDate ? new Date(log.completedDate).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[log.status] ?? "outline"}>{log.status}</Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <MaintenanceActions logId={log.id} status={log.status} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
