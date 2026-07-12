import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import { canAccess } from "@/lib/rbac";

// Edge-safe config (no Prisma imports), used by middleware.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const loggedIn = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname === "/login" || pathname === "/signup") {
        if (loggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      if (pathname === "/") {
        return Response.redirect(new URL(loggedIn ? "/dashboard" : "/login", request.nextUrl));
      }
      if (!loggedIn) return false; // redirects to /login
      if (!canAccess(role, pathname)) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
  },
  providers: [], // filled in auth.ts (credentials needs Node runtime for bcrypt/prisma)
} satisfies NextAuthConfig;
