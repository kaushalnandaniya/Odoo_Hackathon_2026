import type { UserRole } from "@prisma/client";

// Route-prefix access map. FLEET_MANAGER sees everything.
// Per the brief, the DRIVER role creates trips and monitors deliveries.
const ACCESS: Record<UserRole, string[]> = {
  FLEET_MANAGER: ["*"],
  DRIVER: ["/dashboard", "/trips"],
  SAFETY_OFFICER: ["/dashboard", "/drivers"],
  FINANCIAL_ANALYST: ["/dashboard", "/reports", "/fuel-expenses"],
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

export function canAccess(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = ACCESS[role];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function navItemsFor(role: UserRole | undefined) {
  return NAV_ITEMS.filter((item) => canAccess(role, item.href));
}
