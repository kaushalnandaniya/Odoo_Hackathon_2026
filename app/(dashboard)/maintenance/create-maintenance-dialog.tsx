"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { createMaintenanceLog } from "@/lib/actions/maintenance";
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
import type { Vehicle } from "@prisma/client";

export function CreateMaintenanceDialog({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMaintenanceLog, undefined);
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      setVehicleId("");
    }
  }, [state]);

  function submit(formData: FormData) {
    formData.set("vehicleId", vehicleId);
    formAction(formData);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Create Log
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Maintenance Log</DialogTitle>
          <DialogDescription>
            Scheduling maintenance will automatically mark the vehicle as &quot;In Shop&quot;.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4 pt-4">
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle...">
                  {vehicleId ? vehicles.find(v => v.id === vehicleId)?.name : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Input id="serviceType" name="serviceType" placeholder="e.g. Oil Change, Repair" maxLength={100} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional details..." maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost ($)</Label>
              <Input id="cost" name="cost" type="number" min="0" max="10000000" step="any" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" required />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
