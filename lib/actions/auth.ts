"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function login(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard", // This will be intercepted by auth.config.ts middleware
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // NextAuth wraps our custom error, we check the code or the stringified cause
      const errString = String(error.cause?.err || error.message);
      
      if (errString.includes("PENDING_APPROVAL") || (error as { code?: string }).code === "PENDING_APPROVAL") {
        return "Your account is pending admin approval. You cannot log in yet.";
      }
      return "Invalid email or password.";
    }
    throw error; // NEXT_REDIRECT on success must propagate
  }
}

export async function register(_prev: string | undefined, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password || password.length < 8) {
    return "Please fill all fields correctly.";
  }

  try {
    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return "Email is already registered.";
    }

    // Hash password and create user with default PENDING role (as defined in schema)
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

  } catch (error) {
    console.error("Registration error:", error);
    return "Server error during registration.";
  }

  // Instead of auto-login, return a special success code or message
  // Returning a specific string that the client can parse to show success.
  return "SUCCESS: Account created. Please wait for an admin to approve your role before logging in.";
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
