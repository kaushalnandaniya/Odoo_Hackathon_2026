"use client";

import { useState, useTransition } from "react";
import type { TripStatus } from "@prisma/client";
import { cancelTrip, completeTrip, dispatchTrip } from "@/lib/actions/trips";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function TripActions({
  tripId,
  status,
  startOdometer,
}: {
  tripId: string;
  status: TripStatus;
  startOdometer: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(okMessage);
      else toast.error(result.error ?? "Action failed");
    });
  }

  function submitComplete(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await completeTrip({
        tripId,
        endOdometer: formData.get("endOdometer"),
        fuelConsumed: formData.get("fuelConsumed") || undefined,
        revenue: formData.get("revenue") || undefined,
      });
      if (!result.ok) {
        setError(result.error);
      } else {
        setCompleteOpen(false);
        toast.success("Trip completed — vehicle and driver are Available again");
      }
    });
  }

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  return (
    <div className="flex justify-end gap-2">
      {status === "DRAFT" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => dispatchTrip(tripId), "Dispatched — vehicle and driver are On Trip")
          }
        >
          Dispatch
        </Button>
      )}
      {status === "DISPATCHED" && (
        <Button size="sm" disabled={pending} onClick={() => setCompleteOpen(true)}>
          Complete
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => run(() => cancelTrip(tripId), "Trip cancelled")}
      >
        Cancel
      </Button>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
          </DialogHeader>
          <form action={submitComplete} className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="endOdometer">
                Final odometer{startOdometer !== null ? ` (started at ${startOdometer})` : ""}
              </Label>
              <Input
                id="endOdometer"
                name="endOdometer"
                type="number"
                step="any"
                min={startOdometer ?? 0}
                max={2000000}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fuelConsumed">Fuel consumed (L)</Label>
              <Input id="fuelConsumed" name="fuelConsumed" type="number" step="any" min="0" max="10000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="revenue">Revenue (₹)</Label>
              <Input id="revenue" name="revenue" type="number" step="any" min="0" max="10000000" />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Completing..." : "Complete Trip"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
