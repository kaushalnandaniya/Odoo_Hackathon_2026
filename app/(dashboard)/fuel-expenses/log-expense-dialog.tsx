"use client";

import { useState, useActionState, useEffect } from "react";
import { createExpense } from "@/lib/actions/expenses";
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

export function LogExpenseDialog({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [state, formAction, pending] = useActionState(createExpense, undefined);

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
      <DialogTrigger render={<Button variant="secondary" />}>
        <Plus className="mr-2 h-4 w-4" /> Log Expense
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Operational Expense</DialogTitle>
          <DialogDescription>
            Record tolls, parking, or other operational expenses.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4 pt-4">
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle...">
                  {vehicleId ? vehicles.find(v => v.id === vehicleId)?.name : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Expense Type</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOLL" label="Toll">Toll</SelectItem>
                <SelectItem value="PARKING" label="Parking">Parking</SelectItem>
                <SelectItem value="INSURANCE" label="Insurance">Insurance</SelectItem>
                <SelectItem value="PERMIT" label="Permit">Permit</SelectItem>
                <SelectItem value="OTHER" label="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional details..." maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" max="10000000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Log Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
