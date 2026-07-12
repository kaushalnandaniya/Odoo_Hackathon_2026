"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DriverStatus } from "@prisma/client";
import { requireRole } from "@/lib/authz";

const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

const updateDriverSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
});

export async function createDriver(prevState: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = createDriverSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: validatedData.data.licenseNumber },
    });

    if (existing) {
      return { error: "A driver with this license number already exists." };
    }

    await prisma.driver.create({
      data: {
        ...validatedData.data,
        licenseExpiryDate: new Date(validatedData.data.licenseExpiryDate),
        status: DriverStatus.AVAILABLE,
        safetyScore: 100,
      },
    });

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error creating driver:", error);
    return { error: "Failed to register driver." };
  }
}

export async function updateDriver(_prev: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = updateDriverSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const { id, ...data } = validatedData.data;

    await prisma.driver.update({
      where: { id },
      data: {
        ...data,
        licenseExpiryDate: new Date(data.licenseExpiryDate),
      },
    });

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { error: "Failed to update driver." };
  }
}

export async function updateDriverStatus(driverId: string, status: DriverStatus) {
  await requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
  try {
    await prisma.driver.update({
      where: { id: driverId },
      data: { status },
    });
    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error updating driver status:", error);
    return { error: "Failed to update driver status." };
  }
}

export async function deleteDriver(id: string) {
  await requireRole(["FLEET_MANAGER"]);
  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trips: true }
        }
      }
    });

    if (!driver) return { error: "Driver not found" };

    if (driver._count.trips > 0) {
      await prisma.driver.update({
        where: { id },
        data: { status: DriverStatus.SUSPENDED }
      });
    } else {
      await prisma.driver.delete({ where: { id } });
    }

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting driver:", error);
    return { error: "Failed to delete driver." };
  }
}
