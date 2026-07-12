import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateVehicleDialog } from "./create-vehicle-dialog";
import { VehicleActions } from "./vehicle-actions";

export default async function VehiclesPage() {
  const session = await auth();
  const canManage = session?.user.role === "FLEET_MANAGER";

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
        {canManage && <CreateVehicleDialog />}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Reg Number</th>
              <th className="p-4 font-medium">Name / Model</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium text-right">Capacity (kg)</th>
              <th className="p-4 font-medium text-right">Odometer (km)</th>
              <th className="p-4 font-medium">Status</th>
              {canManage && <th className="p-4 font-medium text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="p-4 text-center text-muted-foreground">
                  No vehicles found.
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b">
                  <td className="p-4 font-medium">{vehicle.registrationNumber}</td>
                  <td className="p-4">{vehicle.name}</td>
                  <td className="p-4">{vehicle.type}</td>
                  <td className="p-4 text-right">{vehicle.maxLoadCapacity}</td>
                  <td className="p-4 text-right">{vehicle.odometer?.toLocaleString() ?? "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      vehicle.status === "AVAILABLE" ? "bg-green-100 text-green-800" :
                      vehicle.status === "ON_TRIP" ? "bg-blue-100 text-blue-800" :
                      vehicle.status === "IN_SHOP" ? "bg-yellow-100 text-yellow-800" :
                      vehicle.status === "RETIRED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {vehicle.status.replace("_", " ")}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4 text-right">
                      <VehicleActions vehicle={vehicle} />
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
