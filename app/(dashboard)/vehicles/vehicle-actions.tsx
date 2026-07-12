"use client";

import { useTransition } from "react";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function VehicleActions({ vehicleId, status }: { vehicleId: string, status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to retire or delete this vehicle?")) {
      startTransition(async () => {
        const result = await deleteVehicle(vehicleId);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  if (status === "RETIRED") return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
