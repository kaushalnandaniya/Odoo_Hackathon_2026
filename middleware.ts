import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware: session check + role-based route guard (see authorized() in auth.config).
export default NextAuth(authConfig).auth;

export const config = {
  // Protect everything except static assets and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
