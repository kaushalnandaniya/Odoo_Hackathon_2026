"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DriverStatus } from "@prisma/client";
import { requireRole } from "@/lib/authz";

const phoneRegex = /^\+?[0-9]{7,15}$/;

const createDriverSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  licenseNumber: z.string().trim().min(1, "License number is required").max(50, "License number is too long"),
  licenseCategory: z.string().trim().min(1, "License category is required").max(20, "Category is too long"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().trim().regex(phoneRegex, "Invalid contact number format (7-15 digits)"),
});

const updateDriverSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  licenseCategory: z.string().trim().min(1, "License category is required").max(20, "Category is too long"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().trim().regex(phoneRegex, "Invalid contact number format (7-15 digits)"),
  safetyScore: z.coerce.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100").optional(),
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

export async function rateDriver(driverId: string, scoreAdjustment: number) {
  await requireRole(["FLEET_MANAGER", "SAFETY_OFFICER"]);
  try {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return { error: "Driver not found" };

    const newScore = Math.max(0, Math.min(100, driver.safetyScore + scoreAdjustment));
    const newStatus = newScore < 30 ? DriverStatus.SUSPENDED : driver.status;

    await prisma.driver.update({
      where: { id: driverId },
      data: { 
        safetyScore: newScore,
        status: newStatus
      }
    });

    revalidatePath("/drivers");
    return { success: true, newScore, newStatus };
  } catch (error) {
    console.error("Error rating driver:", error);
    return { error: "Failed to rate driver." };
  }
}
