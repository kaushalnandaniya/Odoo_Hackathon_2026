"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { VehicleStatus } from "@prisma/client";
import { requireRole } from "@/lib/authz";

const createVehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required").max(50, "Registration number is too long"),
  name: z.string().trim().min(1, "Vehicle name/model is required").max(100, "Name is too long"),
  type: z.string().trim().min(1, "Type is required").max(50, "Type is too long"),
  maxLoadCapacity: z.coerce.number().min(0, "Capacity must be positive").max(200000, "Capacity is unreasonably high"),
  odometer: z.coerce.number().min(0, "Odometer must be positive").max(2000000, "Odometer is unreasonably high"),
  acquisitionCost: z.coerce.number().min(0, "Cost must be positive").max(100000000, "Cost is unreasonably high"),
  region: z.string().trim().max(100, "Region is too long").optional(),
});

const updateVehicleSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Vehicle name/model is required").max(100, "Name is too long"),
  type: z.string().trim().min(1, "Type is required").max(50, "Type is too long"),
  maxLoadCapacity: z.coerce.number().min(0, "Capacity must be positive").max(200000, "Capacity is unreasonably high"),
  odometer: z.coerce.number().min(0, "Odometer must be positive").max(2000000, "Odometer is unreasonably high"),
  acquisitionCost: z.coerce.number().min(0, "Cost must be positive").max(100000000, "Cost is unreasonably high"),
  region: z.string().trim().max(100, "Region is too long").optional(),
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
