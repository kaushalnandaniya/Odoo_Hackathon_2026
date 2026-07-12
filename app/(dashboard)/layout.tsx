import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { navItemsFor } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Check if DRIVER has completed onboarding
  if (session.user.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id }
    });
    if (!driver) {
      redirect("/onboarding");
    }
  }

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
