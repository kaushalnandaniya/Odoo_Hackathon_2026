"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { redis } from "@/lib/redis";
import { sendOTP } from "@/lib/email";

export async function login(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard", 
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const errString = String(error.cause?.err || error.message);
      
      if (errString.includes("PENDING_APPROVAL") || (error as { code?: string }).code === "PENDING_APPROVAL") {
        return "Your account is pending admin approval. You cannot log in yet.";
      }
      return "Invalid email or password.";
    }
    throw error; 
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
    // Check if email already exists in Postgres
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return "Email is already registered.";
    }

    // Hash password 
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache user data and OTP in Upstash Redis (expires in 10 minutes)
    const redisKey = `signup:otp:${email}`;
    await redis.set(redisKey, JSON.stringify({ name, email, passwordHash, otp }), { ex: 600 });

    // Send OTP via Brevo
    await sendOTP(email, otp);
    
    // Return a special command string so the UI knows to show the OTP form
    return "REQUIRE_OTP:" + email;

  } catch (error) {
    console.error("Registration error:", error);
    return "Server error during registration.";
  }
}

export async function verifyOTP(_prev: string | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  const otp = formData.get("otp") as string;

  if (!email || !otp) {
    return "Missing verification details.";
  }

  try {
    const redisKey = `signup:otp:${email}`;
    const cachedData = await redis.get(redisKey);

    if (!cachedData) {
      return "OTP has expired or is invalid. Please sign up again.";
    }

    // Upstash automatically parses JSON if it looks like JSON, but just in case:
    const data = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    if (data.otp !== otp) {
      return "Incorrect verification code.";
    }

    // OTP matched! Create the user in Postgres with a timeout to prevent hanging
    const createUserPromise = prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });

    // 10-second timeout for the database call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database connection timeout")), 10000)
    );

    await Promise.race([createUserPromise, timeoutPromise]);

    // Clean up Redis
    await redis.del(redisKey);

    return "SUCCESS: Account verified and created! Please wait for admin approval.";

  } catch (error) {
    console.error("OTP Verification Error:", error);
    if (error instanceof Error && error.message === "Database connection timeout") {
      return "Database timeout. Please try verifying again.";
    }
    return "Server error during verification.";
  }
}

export async function resendOTP(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return "Email is required.";

  try {
    const redisKey = `signup:otp:${email}`;
    const cachedData = await redis.get(redisKey);

    if (!cachedData) {
      return "Session expired. Please start signup again.";
    }

    const data = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    data.otp = newOtp;

    // Save back to Redis with a fresh 10-minute expiration
    await redis.set(redisKey, JSON.stringify(data), { ex: 600 });

    // Send the new OTP
    await sendOTP(email, newOtp);

    return "SUCCESS: A new verification code has been sent.";
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return "Server error while resending OTP.";
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
