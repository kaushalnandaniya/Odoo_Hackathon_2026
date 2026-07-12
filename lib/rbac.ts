import type { UserRole } from "@prisma/client";

// Route-prefix access map. FLEET_MANAGER sees everything.
// Per the brief, the DRIVER role creates trips and monitors deliveries.
const ACCESS: Record<UserRole, string[]> = {
  PENDING: [],
  FLEET_MANAGER: ["*"],
  DRIVER: ["/trips", "/fuel-expenses"],
  SAFETY_OFFICER: ["/dashboard", "/drivers", "/maintenance"],
  FINANCIAL_ANALYST: ["/dashboard", "/reports", "/fuel-expenses", "/maintenance"],
};

export const DEFAULT_ROUTE: Record<UserRole, string> = {
  PENDING: "/pending",
  FLEET_MANAGER: "/dashboard",
  DRIVER: "/trips",
  SAFETY_OFFICER: "/dashboard",
  FINANCIAL_ANALYST: "/dashboard",
};

export const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/drivers", label: "Drivers" },
  { href: "/trips", label: "Trips" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/fuel-expenses", label: "Fuel & Expenses" },
  { href: "/reports", label: "Reports" },
];

export function canAccess(role: UserRole | undefined, pathname: string, email?: string | null): boolean {
  if (!role) return false;
  const allowed = ACCESS[role];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function navItemsFor(role: UserRole | undefined, email?: string | null) {
  return NAV_ITEMS.filter((item) => canAccess(role, item.href, email));
}
