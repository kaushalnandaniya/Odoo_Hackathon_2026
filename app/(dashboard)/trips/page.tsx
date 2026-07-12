import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateTripDialog } from "./create-trip-dialog";
import { TripActions } from "./trip-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  DISPATCHED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function TripsPage() {
  const session = await auth();
  const canManage =
    session?.user.role === "FLEET_MANAGER" || session?.user.role === "DRIVER";

  const [trips, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { status: "AVAILABLE" }, orderBy: { name: "asc" } }),
    prisma.driver.findMany({
      where: { status: "AVAILABLE", licenseExpiryDate: { gt: new Date() } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Dispatch, complete, or cancel trips. Statuses update automatically.
          </p>
        </div>
        {canManage && <CreateTripDialog vehicles={vehicles} drivers={drivers} />}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Cargo (kg)</TableHead>
            <TableHead className="text-right">Planned (km)</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No trips yet. Create one to get started.
              </TableCell>
            </TableRow>
          )}
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-mono text-xs">{trip.tripCode}</TableCell>
              <TableCell>
                {trip.source} → {trip.destination}
              </TableCell>
              <TableCell>{trip.vehicle.name}</TableCell>
              <TableCell>{trip.driver.name}</TableCell>
              <TableCell className="text-right">{trip.cargoWeight}</TableCell>
              <TableCell className="text-right">{trip.plannedDistance}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[trip.status] ?? "outline"}>{trip.status}</Badge>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <TripActions
                    tripId={trip.id}
                    status={trip.status}
                    startOdometer={trip.startOdometer}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
