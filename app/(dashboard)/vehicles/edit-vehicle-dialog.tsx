"use client";

import { useState, useActionState, useEffect } from "react";
import type { Vehicle } from "@prisma/client";
import { updateVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function EditVehicleDialog({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateVehicle, undefined);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>Update {vehicle.name} details.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-4">
          <input type="hidden" name="id" value={vehicle.id} />
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name / Model</Label>
            <Input id="name" name="name" defaultValue={vehicle.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" name="type" defaultValue={vehicle.type} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoadCapacity">Max Load (kg)</Label>
              <Input id="maxLoadCapacity" name="maxLoadCapacity" type="number" min="0" defaultValue={vehicle.maxLoadCapacity} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input id="odometer" name="odometer" type="number" min="0" defaultValue={vehicle.odometer} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisitionCost">Cost ($)</Label>
              <Input id="acquisitionCost" name="acquisitionCost" type="number" min="0" defaultValue={vehicle.acquisitionCost} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" name="region" defaultValue={vehicle.region || ""} />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
