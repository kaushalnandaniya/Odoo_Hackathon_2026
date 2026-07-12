import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateTripDialog } from "./create-trip-dialog";
import { TripActions } from "./trip-actions";

export default async function TripsPage() {
  const session = await auth();
  const isDriver = session?.user.role === "DRIVER";
  const canManage = session?.user.role === "FLEET_MANAGER" || isDriver;
  const canCreateTrip = session?.user.role === "FLEET_MANAGER";

  let driverId: string | undefined = undefined;
  if (isDriver && session?.user?.id) {
    const driverRecord = await prisma.driver.findUnique({ where: { userId: session.user.id } });
    driverId = driverRecord?.id || "unassigned";
  }

  const tripWhere = isDriver ? { driverId } : undefined;

  const [trips, vehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      where: tripWhere,
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Trips</h2>
        {canManage && <CreateTripDialog vehicles={vehicles} drivers={drivers} />}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Code</th>
              <th className="p-4 font-medium">Route</th>
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Driver</th>
              <th className="p-4 font-medium text-right">Cargo (kg)</th>
              <th className="p-4 font-medium text-right">Planned (km)</th>
              <th className="p-4 font-medium">Status</th>
              {canManage && <th className="p-4 font-medium text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="p-4 text-center text-muted-foreground">
                  No trips yet. Create one to get started.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-mono text-xs font-medium">{trip.tripCode}</td>
                  <td className="p-4">{trip.source} → {trip.destination}</td>
                  <td className="p-4">{trip.vehicle.name}</td>
                  <td className="p-4">{trip.driver.name}</td>
                  <td className="p-4 text-right">{trip.cargoWeight}</td>
                  <td className="p-4 text-right">{trip.plannedDistance}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      trip.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                      trip.status === "DISPATCHED" ? "bg-blue-100 text-blue-800" :
                      trip.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      trip.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4 text-right">
                      <TripActions
                        tripId={trip.id}
                        status={trip.status}
                        startOdometer={trip.startOdometer}
                      />
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
