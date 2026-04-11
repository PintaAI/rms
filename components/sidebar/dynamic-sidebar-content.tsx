"use client";

import { useAuth } from "@/components/auth-provider";
import { AdminSidebarContent } from "./admin-sidebar-content";
import { StaffSidebarContent } from "./staff-sidebar-content";
import { TechnicianSidebarContent } from "./technician-sidebar-content";

export function DynamicSidebarContent() {
  const { session, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session.user as any).role || "staff";

  switch (role) {
    case "admin":
      return <AdminSidebarContent />;
    case "technician":
      return <TechnicianSidebarContent />;
    case "staff":
    default:
      return <StaffSidebarContent />;
  }
}