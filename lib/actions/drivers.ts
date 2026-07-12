"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DriverStatus } from "@prisma/client";

const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "Expiry date is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
});

export async function createDriver(prevState: unknown, formData: FormData) {
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
        safetyScore: 100, // Default perfect score on register
      },
    });

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error creating driver:", error);
    return { error: "Failed to register driver." };
  }
}

export async function deleteDriver(id: string) {
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
      // Soft delete / suspend
      await prisma.driver.update({
        where: { id },
        data: { status: DriverStatus.SUSPENDED }
      });
    } else {
      // Hard delete
      await prisma.driver.delete({ where: { id } });
    }

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting driver:", error);
    return { error: "Failed to delete driver." };
  }
}
