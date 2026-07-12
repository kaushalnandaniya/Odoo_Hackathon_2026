

interface VehicleStatusBarsProps {
  data: {
    available: number;
    onTrip: number;
    inShop: number;
    retired: number;
  };
}

export function VehicleStatusBars({ data }: VehicleStatusBarsProps) {
  const total = data.available + data.onTrip + data.inShop + data.retired;
  
  // Prevent division by zero if there are no vehicles
  const safeTotal = total > 0 ? total : 1;

  const statuses = [
    { label: "Available", value: data.available, color: "bg-green-500" },
    { label: "On Trip", value: data.onTrip, color: "bg-blue-500" },
    { label: "In Shop", value: data.inShop, color: "bg-amber-600" },
    { label: "Retired", value: data.retired, color: "bg-red-400" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vehicle Status</h3>
      <div className="flex flex-col space-y-4">
        {statuses.map((status) => {
          const percentage = Math.round((status.value / safeTotal) * 100);
          
          return (
            <div key={status.label} className="flex items-center space-x-4">
              <div className="w-24 text-sm font-medium">{status.label}</div>
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${status.color} rounded-full transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
