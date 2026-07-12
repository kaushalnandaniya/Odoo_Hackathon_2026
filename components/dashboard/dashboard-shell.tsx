"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3,
  PanelLeftClose, PanelLeft, Sun, Moon,
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

export function DashboardShell({
  items,
  userName,
  userRole,
  children,
}: {
  items: { href: string; label: string }[];
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          collapsed ? "w-[68px]" : "w-60"
        } flex shrink-0 flex-col border-r bg-sidebar h-full transition-all duration-300 ease-in-out`}
      >
        {/* Header / Brand */}
        <div className={`flex items-center border-b px-4 py-4 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm">
            <Route className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-base font-bold tracking-tight text-sidebar-foreground truncate">TransitOps</div>
              <div className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase truncate">Fleet Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-4 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {NAV_ICONS[item.href] || null}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t px-3 py-3 space-y-2">
          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "px-0 justify-center" : "justify-start gap-2"}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Collapse</>}
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "px-0 justify-center" : "justify-start gap-2"}`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span className="truncate">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </Button>

          {/* User */}
          <div className={`flex items-center border-t pt-3 ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-bold text-sidebar-accent-foreground">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</div>
                <Badge variant="secondary" className="mt-0.5 text-[9px] px-1.5 py-0">
                  {userRole.replace("_", " ")}
                </Badge>
              </div>
            )}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-muted/20">{children}</main>
    </div>
  );
}
