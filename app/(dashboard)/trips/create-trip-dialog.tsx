"use client";

import { useMemo, useState, useTransition } from "react";
import type { Driver, Vehicle } from "@prisma/client";
import { createTrip } from "@/lib/actions/trips";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateTripDialog({
  vehicles,
  drivers,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargo, setCargo] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );
  const cargoNum = parseFloat(cargo);
  const overloaded =
    !!selectedVehicle && !Number.isNaN(cargoNum) && cargoNum > selectedVehicle.maxLoadCapacity;

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTrip({
        source: formData.get("source"),
        destination: formData.get("destination"),
        vehicleId,
        driverId,
        cargoWeight: formData.get("cargoWeight"),
        plannedDistance: formData.get("plannedDistance"),
        revenue: formData.get("revenue") || 0,
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setOpen(false);
        setVehicleId("");
        setDriverId("");
        setCargo("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>New Trip</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Trip</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Mumbai" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" name="destination" placeholder="Pune" required />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Vehicle (available only)</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an available vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No available vehicles
                  </div>
                )}
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} · {v.registrationNumber} · max {v.maxLoadCapacity} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Driver (available, valid license)</Label>
            <Select value={driverId} onValueChange={(v) => setDriverId(v ?? "")} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an eligible driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No eligible drivers
                  </div>
                )}
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.licenseCategory} · safety {d.safetyScore}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cargoWeight">Cargo (kg)</Label>
              <Input
                id="cargoWeight"
                name="cargoWeight"
                type="number"
                step="any"
                min="0.01"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plannedDistance">Distance (km)</Label>
              <Input
                id="plannedDistance"
                name="plannedDistance"
                type="number"
                step="any"
                min="0.01"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="revenue">Revenue (₹)</Label>
              <Input id="revenue" name="revenue" type="number" step="any" min="0" />
            </div>
          </div>

          {overloaded && selectedVehicle && (
            <Alert variant="destructive">
              <AlertDescription>
                {cargoNum} kg exceeds {selectedVehicle.name}&apos;s capacity of{" "}
                {selectedVehicle.maxLoadCapacity} kg.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={pending || overloaded || !vehicleId || !driverId}
          >
            {pending ? "Creating..." : "Create Trip (Draft)"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
