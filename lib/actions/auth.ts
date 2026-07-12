"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function login(_prev: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
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

    // Hash password and create user
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

  // Auto-login after successful registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    throw error; 
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
