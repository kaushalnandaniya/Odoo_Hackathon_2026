import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TripStatus } from "@prisma/client";

interface RecentTripsProps {
  trips: {
    tripCode: string;
    vehicle: { name: string; registrationNumber: string };
    driver: { name: string };
    status: TripStatus;
    plannedDistance: number;
    dispatchedAt: Date | null;
  }[];
}

const statusColors: Record<TripStatus, string> = {
  DISPATCHED: "bg-blue-500 text-white hover:bg-blue-600",
  COMPLETED: "bg-green-500 text-white hover:bg-green-600",
  DRAFT: "bg-gray-500 text-white hover:bg-gray-600",
  CANCELLED: "bg-red-500 text-white hover:bg-red-600",
};

export function RecentTrips({ trips }: RecentTripsProps) {
  // A helper function to mock an ETA based on planned distance
  const getEta = (status: TripStatus, distance: number) => {
    if (status === "COMPLETED" || status === "CANCELLED") return "—";
    if (status === "DRAFT") return "Awaiting vehicle";
    
    // Mock ETA calculation: assuming 60 km/h average speed.
    const hours = Math.floor(distance / 60);
    const mins = Math.round((distance % 60) / (60 / 60));
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Trips</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px] text-xs uppercase">Trip</TableHead>
              <TableHead className="text-xs uppercase">Vehicle</TableHead>
              <TableHead className="text-xs uppercase">Driver</TableHead>
              <TableHead className="text-xs uppercase">Status</TableHead>
              <TableHead className="text-right text-xs uppercase">ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No recent trips found.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.tripCode}>
                  <TableCell className="font-medium">{trip.tripCode}</TableCell>
                  <TableCell>{trip.vehicle.registrationNumber}</TableCell>
                  <TableCell>{trip.driver.name}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[trip.status]} variant="secondary">
                      {trip.status === "DISPATCHED" ? "On Trip" : trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{getEta(trip.status, trip.plannedDistance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
