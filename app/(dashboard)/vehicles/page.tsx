import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CreateVehicleDialog } from "./create-vehicle-dialog";
import { VehicleActions } from "./vehicle-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "default",
  ON_TRIP: "secondary",
  IN_SHOP: "destructive",
  DECOMMISSIONED: "outline",
};

export default async function VehiclesPage() {
  const session = await auth();
  const canManage = session?.user.role === "FLEET_MANAGER";

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage fleet vehicles, track odometer readings, and monitor status.
          </p>
        </div>
        {canManage && <CreateVehicleDialog />}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reg Number</TableHead>
            <TableHead>Name / Model</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Capacity (kg)</TableHead>
            <TableHead className="text-right">Odometer (km)</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                No vehicles found.
              </TableCell>
            </TableRow>
          )}
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
              <TableCell>{vehicle.name}</TableCell>
              <TableCell>{vehicle.type}</TableCell>
              <TableCell className="text-right">{vehicle.maxLoadCapacity}</TableCell>
              <TableCell className="text-right">{vehicle.odometer?.toLocaleString() ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[vehicle.status] ?? "outline"}>{vehicle.status.replace("_", " ")}</Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <VehicleActions vehicle={vehicle} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
