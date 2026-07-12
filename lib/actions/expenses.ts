"use server";

import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExpenseType } from "@prisma/client";

const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  liters: z.coerce.number().min(0.1, "Liters must be > 0"),
  cost: z.coerce.number().min(0, "Total cost must be >= 0"),
  date: z.string().min(1, "Date is required"),
});

const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.nativeEnum(ExpenseType, {
    error: "Invalid expense type"
  }),
  amount: z.coerce.number().min(0, "Amount must be >= 0"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export async function createFuelLog(prevState: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER", "FINANCIAL_ANALYST", "DRIVER"]);
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = fuelLogSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const { vehicleId, liters, cost, date } = validatedData.data;

    await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters,
        totalCost: cost,
        costPerLiter: cost / liters,
        loggedAt: new Date(date),
      },
    });

    revalidatePath("/fuel-expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("Error creating fuel log:", error);
    return { error: "Failed to create fuel log." };
  }
}

export async function createExpense(prevState: unknown, formData: FormData) {
  await requireRole(["FLEET_MANAGER", "FINANCIAL_ANALYST", "DRIVER"]);
  try {
    const rawData = Object.fromEntries(formData.entries());
    // Type casting string to enum is handled by nativeEnum
    const validatedData = expenseSchema.safeParse(rawData);

    if (!validatedData.success) {
      return { error: "Invalid form data. Please check your inputs." };
    }

    const { vehicleId, type, amount, description, date } = validatedData.data;

    await prisma.expense.create({
      data: {
        vehicleId,
        type,
        amount,
        description,
        expenseDate: new Date(date),
      },
    });

    revalidatePath("/fuel-expenses");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { error: "Failed to create expense." };
  }
}
