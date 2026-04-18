import { redirect } from "next/navigation";
import { getUser } from "@/lib/get-session";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getUser();

  if (!sessionUser) {
    redirect("/auth/login");
  }

  const tokoList = sessionUser.tokos ?? [];
  const isAdmin = sessionUser.role === "admin";

  return (
    <DashboardLayoutClient tokoList={tokoList} isAdmin={isAdmin}>
      {children}
    </DashboardLayoutClient>
  );
}