"use client";

import { useTransition } from "react";
import type { Driver, DriverStatus } from "@prisma/client";
import { deleteDriver, updateDriverStatus } from "@/lib/actions/drivers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal, UserCheck, UserX, UserMinus } from "lucide-react";
import { EditDriverDialog } from "./edit-driver-dialog";
import { toast } from "sonner";

export function DriverActions({ driver }: { driver: Driver }) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (status: DriverStatus) => {
    startTransition(async () => {
      const result = await updateDriverStatus(driver.id, status);
      if (result?.error) toast.error(result.error);
      else toast.success(`Status changed to ${status}`);
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to suspend or delete this driver?")) {
      startTransition(async () => {
        const result = await deleteDriver(driver.id);
        if (result?.error) toast.error(result.error);
        else toast.success("Driver removed");
      });
    }
  };

  if (driver.status === "SUSPENDED") return null;

  return (
    <div className="flex justify-end gap-1">
      <EditDriverDialog driver={driver} />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {driver.status !== "AVAILABLE" && (
            <DropdownMenuItem onClick={() => handleStatus("AVAILABLE")}>
              <UserCheck className="mr-2 h-4 w-4" /> Set Available
            </DropdownMenuItem>
          )}
          {driver.status !== "OFF_DUTY" && (
            <DropdownMenuItem onClick={() => handleStatus("OFF_DUTY")}>
              <UserMinus className="mr-2 h-4 w-4" /> Set Off Duty
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleStatus("SUSPENDED")}>
            <UserX className="mr-2 h-4 w-4" /> Suspend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
