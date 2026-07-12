"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VehicleStatus } from "@prisma/client";

const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Vehicle name/model is required"),
  type: z.string().min(1, "Type is required"),
  maxLoadCapacity: z.coerce.number().min(0, "Capacity must be positive"),
  odometer: z.coerce.number().min(0, "Odometer must be positive"),
  acquisitionCost: z.coerce.number().min(0, "Cost must be positive"),
  region: z.string().optional(),
});

export async function createVehicle(prevState: unknown, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createVehicleSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: validatedData.data.registrationNumber },
    });

    if (existing) {
      return { error: "A vehicle with this registration number already exists." };
    }

    await prisma.vehicle.create({
      data: {
        ...validatedData.data,
        status: VehicleStatus.AVAILABLE,
      },
    });

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return { error: "Failed to create vehicle." };
  }
}

export async function deleteVehicle(id: string) {
  try {
    // Determine if it has trips, if so we might only be able to retire it
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trips: true, maintenanceLogs: true, fuelLogs: true }
        }
      }
    });

    if (!vehicle) return { error: "Vehicle not found" };

    const hasRelations = vehicle._count.trips > 0 || vehicle._count.maintenanceLogs > 0 || vehicle._count.fuelLogs > 0;

    if (hasRelations) {
      // Soft delete / Retire
      await prisma.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.RETIRED }
      });
    } else {
      // Hard delete
      await prisma.vehicle.delete({ where: { id } });
    }

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return { error: "Failed to delete vehicle." };
  }
}
