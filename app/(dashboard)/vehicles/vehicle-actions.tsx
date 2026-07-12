"use client";

import { useTransition } from "react";
import type { Vehicle } from "@prisma/client";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditVehicleDialog } from "./edit-vehicle-dialog";
import { toast } from "sonner";

export function VehicleActions({ vehicle }: { vehicle: Vehicle }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to retire or delete this vehicle?")) {
      startTransition(async () => {
        const result = await deleteVehicle(vehicle.id);
        if (result?.error) toast.error(result.error);
        else toast.success("Vehicle removed");
      });
    }
  };

  if (vehicle.status === "RETIRED") return null;

  return (
    <div className="flex justify-end gap-1">
      <EditVehicleDialog vehicle={vehicle} />
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
