"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

export async function approveUser(userId: string, newRole: UserRole) {
  const session = await auth();
  if (session?.user?.role !== "FLEET_MANAGER") {
    throw new Error("Unauthorized");
  }

  if (newRole === "PENDING") {
    throw new Error("Cannot assign the PENDING role.");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    
    // Revalidate the dashboard to instantly reflect the removal of the pending user
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error approving user:", error);
    return { success: false, error: "Failed to approve user." };
  }
}
