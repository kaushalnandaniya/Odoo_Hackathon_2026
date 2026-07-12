"use client";

import { useState, useActionState, useEffect } from "react";
import { createVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateVehicleDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createVehicle, undefined);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Add Vehicle
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Register a new vehicle to the fleet. It will be marked as available immediately.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input id="registrationNumber" name="registrationNumber" placeholder="e.g. VAN-05" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name / Model</Label>
            <Input id="name" name="name" placeholder="e.g. Ford Transit" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input id="type" name="type" placeholder="e.g. Van" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoadCapacity">Max Load (kg)</Label>
              <Input id="maxLoadCapacity" name="maxLoadCapacity" type="number" min="0" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input id="odometer" name="odometer" type="number" min="0" defaultValue="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisitionCost">Cost ($)</Label>
              <Input id="acquisitionCost" name="acquisitionCost" type="number" min="0" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" name="region" placeholder="e.g. North Area" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
