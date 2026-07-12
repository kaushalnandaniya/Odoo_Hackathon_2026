"use client";

import { useTransition } from "react";
import { closeMaintenanceLog } from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function MaintenanceActions({ logId, status }: { logId: string, status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (confirm("Mark this maintenance as completed and restore vehicle to Available?")) {
      startTransition(async () => {
        const result = await closeMaintenanceLog(logId);
        if (result?.error) {
          alert(result.error);
        }
      });
    }
  };

  if (status === "CLOSED") return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClose}
      disabled={isPending}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Complete
    </Button>
  );
}
