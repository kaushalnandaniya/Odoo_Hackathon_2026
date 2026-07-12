"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VehicleStatus } from "@prisma/client";
import { requireRole } from "@/lib/authz";

const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Vehicle name/model is required"),
  type: z.string().min(1, "Type is required"),
  maxLoadCapacity: z.coerce.number().min(0, "Capacity must be positive"),
  odometer: z.coerce.number().min(0, "Odometer must be positive"),
  acquisitionCost: z.coerce.number().min(0, "Cost must be positive"),
  region: z.string().optional(),
});

const updateVehicleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Vehicle name/model is required"),
  type: z.string().min(1, "Type is required"),
  maxLoadCapacity: z.coerce.number().min(0, "Capacity must be positive"),
  odometer: z.coerce.number().min(0, "Odometer must be positive"),
  acquisitionCost: z.coerce.number().min(0, "Cost must be positive"),
  region: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export async function createVehicle(prevState: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER"]);
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

export async function updateVehicle(_prev: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER"]);
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = updateVehicleSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const { id, ...data } = validatedData.data;

    await prisma.vehicle.update({
      where: { id },
      data,
    });

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return { error: "Failed to update vehicle." };
  }
}

export async function deleteVehicle(id: string) {
  await requireRole(["FLEET_MANAGER"]);
  try {
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
      await prisma.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.RETIRED }
      });
    } else {
      await prisma.vehicle.delete({ where: { id } });
    }

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return { error: "Failed to delete vehicle." };
  }
}
