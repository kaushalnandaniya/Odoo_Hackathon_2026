"use client";

import { useState, useActionState, useEffect } from "react";
import { createFuelLog } from "@/lib/actions/expenses";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vehicle } from "@prisma/client";

export function LogFuelDialog({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createFuelLog, undefined);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Log Fuel
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Fuel Consumption</DialogTitle>
          <DialogDescription>
            Record fuel used by a specific vehicle.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select name="vehicleId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id} label={`${v.name} (${v.registrationNumber})`}>{`${v.name} (${v.registrationNumber})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="liters">Liters</Label>
              <Input id="liters" name="liters" type="number" step="0.1" min="0.1" max="5000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Total Cost ($)</Label>
              <Input id="cost" name="cost" type="number" step="0.01" min="0" max="1000000" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Log Fuel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
