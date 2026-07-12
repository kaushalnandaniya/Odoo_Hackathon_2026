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
    <DashboardShell
      items={items}
      userName={session.user.name ?? "User"}
      userRole={session.user.role ?? "PENDING"}
    >
      {children}
    </DashboardShell>
  );
}
