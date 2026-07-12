"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VehicleStatus, MaintStatus } from "@prisma/client";

const createLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost must be positive"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
});

export async function createMaintenanceLog(prevState: unknown, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createLogSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    // Must run in a transaction: Create log AND update vehicle status to IN_SHOP
    await prisma.$transaction(async (tx) => {
      // 1. Verify vehicle isn't already IN_SHOP or ON_TRIP or RETIRED
      const vehicle = await tx.vehicle.findUnique({
        where: { id: validatedData.data.vehicleId }
      });

      if (!vehicle || vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new Error("Vehicle is not available for maintenance.");
      }

      // 2. Create the log
      await tx.maintenanceLog.create({
        data: {
          ...validatedData.data,
          scheduledDate: new Date(validatedData.data.scheduledDate),
          status: MaintStatus.OPEN,
        }
      });

      // 3. Update vehicle status
      await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.IN_SHOP }
      });
    });

    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating maintenance log:", error);
    return { error: error instanceof Error ? error.message : "Failed to create maintenance log." };
  }
}

export async function closeMaintenanceLog(id: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({
        where: { id },
        include: { vehicle: true }
      });

      if (!log || log.status === MaintStatus.CLOSED) {
        throw new Error("Log not found or already closed.");
      }

      // 1. Update log
      await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: MaintStatus.CLOSED,
          completedDate: new Date(),
        }
      });

      // 2. Update vehicle (if it was IN_SHOP, maybe someone retired it manually)
      if (log.vehicle.status === VehicleStatus.IN_SHOP) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE }
        });
      }
    });

    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error closing maintenance log:", error);
    return { error: error instanceof Error ? error.message : "Failed to close maintenance log." };
  }
}
