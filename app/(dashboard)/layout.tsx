import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { navItemsFor } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const items = navItemsFor(session.user.role, session.user.email);

  return (
<<<<<<< Updated upstream
    <DashboardShell
      items={items}
      userName={session.user.name ?? "User"}
      userRole={session.user.role ?? "PENDING"}
    >
      {children}
    </DashboardShell>
=======
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar h-full">
        <div className="shrink-0 border-b p-4">
          <div className="text-lg font-bold">TransitOps</div>
          <div className="text-xs text-muted-foreground">Transport Operations</div>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 space-y-2 border-t p-4">
          <div className="truncate text-sm font-medium">{session.user.name}</div>
          <Badge variant="secondary" className="text-[10px]">
            {session.user.role.replace("_", " ")}
          </Badge>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
>>>>>>> Stashed changes
  );
}
