import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import { canAccess } from "@/lib/rbac";

// Edge-safe config (no Prisma imports) — used by middleware.
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

      // Route user to their designated dashboard
      const getRoleDashboard = (role: string | undefined) => {
        switch (role) {
          case "FLEET_MANAGER": return "/dashboard";
          case "FINANCIAL_ANALYST": return "/reports";
          case "DRIVER": return "/trips";
          case "SAFETY_OFFICER": return "/drivers";
          default: return "/login";
        }
      };

      if (pathname === "/login" || pathname === "/signup") {
        if (loggedIn) return Response.redirect(new URL(getRoleDashboard(role), request.nextUrl));
        return true;
      }
      if (pathname === "/") {
        return Response.redirect(new URL(loggedIn ? getRoleDashboard(role) : "/login", request.nextUrl));
      }
      if (!loggedIn) return false; // redirects to /login
      if (!canAccess(role, pathname)) {
        return Response.redirect(new URL(getRoleDashboard(role), request.nextUrl));
      }
      return true;
    },
  },
  providers: [], // filled in auth.ts (credentials needs Node runtime for bcrypt/prisma)
} satisfies NextAuthConfig;
