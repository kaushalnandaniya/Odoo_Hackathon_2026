import { Activity, Car, Wrench, Navigation, CheckCircle, Users, BarChart3 } from "lucide-react";

interface KpiCardsProps {
  metrics: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: string;
  };
}

const cards = [
  { key: "activeVehicles", label: "Active Vehicles", icon: Navigation, desc: "Currently on a trip" },
  { key: "availableVehicles", label: "Available Vehicles", icon: Car, desc: "Ready for dispatch" },
  { key: "inMaintenance", label: "In Maintenance", icon: Wrench, desc: "In shop for repairs" },
  { key: "activeTrips", label: "Active Trips", icon: Activity, desc: "Dispatched in progress" },
  { key: "pendingTrips", label: "Pending Trips", icon: CheckCircle, desc: "Draft trips awaiting dispatch" },
  { key: "driversOnDuty", label: "Drivers On Duty", icon: Users, desc: "Available + On Trip" },
  { key: "fleetUtilization", label: "Fleet Utilization", icon: BarChart3, desc: "Of non-retired vehicles" },
];

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const value = metrics[card.key as keyof typeof metrics];
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">{value}{card.key === "fleetUtilization" ? "%" : ""}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
