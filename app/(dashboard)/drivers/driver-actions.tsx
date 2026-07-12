"use client";

import { useTransition } from "react";
import { deleteDriver } from "@/lib/actions/drivers";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DriverActions({ driverId, status }: { driverId: string, status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to suspend or delete this driver?")) {
      startTransition(async () => {
        const result = await deleteDriver(driverId);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  if (status === "SUSPENDED") return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
