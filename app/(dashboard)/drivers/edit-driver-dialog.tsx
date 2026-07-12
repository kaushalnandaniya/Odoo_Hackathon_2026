"use client";

import { useState, useActionState, useEffect } from "react";
import type { Driver } from "@prisma/client";
import { updateDriver } from "@/lib/actions/drivers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function EditDriverDialog({ driver }: { driver: Driver }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateDriver, undefined);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  const toDateInput = (d: Date) => d.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
          <DialogDescription>Update {driver.name} details.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-4">
          <input type="hidden" name="id" value={driver.id} />
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" defaultValue={driver.name} maxLength={100} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseCategory">Category</Label>
              <Input id="licenseCategory" name="licenseCategory" defaultValue={driver.licenseCategory} maxLength={20} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseExpiryDate">License Expiry</Label>
              <Input id="licenseExpiryDate" name="licenseExpiryDate" type="date" defaultValue={toDateInput(driver.licenseExpiryDate)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Phone</Label>
              <Input id="contactNumber" name="contactNumber" defaultValue={driver.contactNumber} pattern="^\+?[0-9]{7,15}$" title="Phone number (7-15 digits), optionally starting with +" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="safetyScore">Safety Score (0-100)</Label>
              <Input id="safetyScore" name="safetyScore" type="number" min="0" max="100" defaultValue={driver.safetyScore} />
            </div>
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
