import "server-only";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Server-side guard for actions/queries. RBAC is enforced HERE, not by hiding buttons.
 * Usage: const session = await requireRole(["FLEET_MANAGER", "DRIVER"]);
 * Pass no roles to require any authenticated user.
 */
export async function requireRole(roles?: UserRole[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: not signed in");
  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    throw new Error("Forbidden: your role cannot perform this action");
  }
  return session;
}
