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
  {
    key: "activeVehicles",
    label: "Active Vehicles",
    icon: Navigation,
    desc: "Currently on a trip",
    accent: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "availableVehicles",
    label: "Available Vehicles",
    icon: Car,
    desc: "Ready for dispatch",
    accent: "bg-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "inMaintenance",
    label: "In Maintenance",
    icon: Wrench,
    desc: "In shop for repairs",
    accent: "bg-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "activeTrips",
    label: "Active Trips",
    icon: Activity,
    desc: "Dispatched in progress",
    accent: "bg-violet-500",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "pendingTrips",
    label: "Pending Trips",
    icon: CheckCircle,
    desc: "Draft trips awaiting dispatch",
    accent: "bg-rose-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    key: "driversOnDuty",
    label: "Drivers On Duty",
    icon: Users,
    desc: "Available + On Trip",
    accent: "bg-cyan-500",
    lightBg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "fleetUtilization",
    label: "Fleet Utilization",
    icon: BarChart3,
    desc: "Of non-retired vehicles",
    accent: "bg-orange-500",
    lightBg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
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
            className="relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`absolute top-0 left-0 h-1 w-full ${card.accent}`} />
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">{value}{card.key === "fleetUtilization" ? "%" : ""}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.lightBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
