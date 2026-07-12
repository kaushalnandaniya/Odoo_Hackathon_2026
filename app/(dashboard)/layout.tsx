import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { navItemsFor } from "@/lib/rbac";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3,
} from "lucide-react";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-4 w-4" />,
  "/vehicles": <Truck className="h-4 w-4" />,
  "/drivers": <Users className="h-4 w-4" />,
  "/trips": <Route className="h-4 w-4" />,
  "/maintenance": <Wrench className="h-4 w-4" />,
  "/fuel-expenses": <Fuel className="h-4 w-4" />,
  "/reports": <BarChart3 className="h-4 w-4" />,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const items = navItemsFor(session.user.role, session.user.email);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar h-full">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm">
            <Route className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-sidebar-foreground">TransitOps</div>
            <div className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">Fleet Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
            >
              {NAV_ICONS[item.href] || null}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground">
              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">{session.user.name}</div>
              <Badge variant="secondary" className="mt-0.5 text-[9px] px-1.5 py-0">
                {session.user.role.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20">{children}</main>
    </div>
  );
}
