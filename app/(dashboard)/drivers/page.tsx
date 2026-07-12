import { prisma } from "@/lib/prisma";
import { CreateDriverDialog } from "./create-driver-dialog";
import { DriverActions } from "./driver-actions";

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
        <CreateDriverDialog />
      </div>
      
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">License No.</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Expiry</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No drivers found.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => {
                const isExpired = new Date(driver.licenseExpiryDate) < new Date();
                return (
                  <tr key={driver.id} className="border-b">
                    <td className="p-4 font-medium">{driver.name}</td>
                    <td className="p-4">{driver.licenseNumber}</td>
                    <td className="p-4">{driver.licenseCategory}</td>
                    <td className="p-4">
                      <span className={isExpired ? "text-destructive font-bold" : ""}>
                        {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">{driver.contactNumber}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        driver.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        driver.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-800' :
                        driver.status === 'OFF_DUTY' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {driver.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <DriverActions driverId={driver.id} status={driver.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
