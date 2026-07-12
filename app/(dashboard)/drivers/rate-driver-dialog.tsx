"use client";

import { useState, useTransition } from "react";
import type { Driver } from "@prisma/client";
import { rateDriver } from "@/lib/actions/drivers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RateDriverDialogProps {
  driver: Driver;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RateDriverDialog({ driver, open, onOpenChange }: RateDriverDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [scoreAdjustment, setScoreAdjustment] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await rateDriver(driver.id, scoreAdjustment);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Driver rated successfully. New Score: ${result.newScore}`);
        if (result.newStatus === "SUSPENDED" && driver.status !== "SUSPENDED") {
          toast.error(`${driver.name} has been suspended due to low safety score!`);
        }
        setScoreAdjustment(0);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Driver: {driver.name}</DialogTitle>
          <DialogDescription>
            Current Safety Score: <span className="font-bold">{driver.safetyScore}</span>.
            Enter a positive or negative number to adjust their score.
            If the score drops below 30, they will be automatically suspended.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="adjustment">Score Adjustment</Label>
            <Input
              id="adjustment"
              type="number"
              value={scoreAdjustment}
              onChange={(e) => setScoreAdjustment(parseInt(e.target.value) || 0)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
