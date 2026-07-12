"use client";

import { useState, useActionState, useEffect } from "react";
import { createDriver } from "@/lib/actions/drivers";
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

export function CreateDriverDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createDriver, undefined);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" /> Register Driver
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New Driver</DialogTitle>
          <DialogDescription>
            Add a new driver to the platform. They will be immediately available for dispatch.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-4">
          {state?.error && (
            <div className="text-sm font-medium text-destructive">{state.error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="e.g. John Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input id="licenseNumber" name="licenseNumber" placeholder="e.g. DL-12345" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseCategory">Category</Label>
              <Input id="licenseCategory" name="licenseCategory" placeholder="e.g. Heavy Commercial" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseExpiryDate">License Expiry</Label>
              <Input id="licenseExpiryDate" name="licenseExpiryDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Phone</Label>
              <Input id="contactNumber" name="contactNumber" placeholder="+123456789" required />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Register Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
