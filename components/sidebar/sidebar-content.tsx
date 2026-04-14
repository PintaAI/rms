"use client";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  RiDashboardLine,
  RiBarChart2Line,
  RiTeamLine,
  RiFileListLine,
  RiStore2Line,
  RiToolsLine,
  RiCheckboxCircleLine,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export type SidebarMenuItemConfig = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type SidebarConfig = {
  groupLabel: string;
  items: SidebarMenuItemConfig[];
};

export const sidebarConfigs: Record<string, SidebarConfig> = {
  admin: {
    groupLabel: "Admin Menu",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard/admin",
        icon: RiDashboardLine,
      },
      {
        title: "Staff & Teknisi",
        href: "/dashboard/admin/karyawan",
        icon: RiTeamLine,
      },
      {
        title: "Sparepart & Jasa",
        href: "/dashboard/admin/inventory",
        icon: RiFileListLine,
      },
      {
        title: "Kelola Toko",
        href: "/dashboard/admin/toko",
        icon: RiStore2Line,
      },
    ],
  },
  staff: {
    groupLabel: "Staff Menu",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard/staff",
        icon: RiDashboardLine,
      },
      {
        title: "Services",
        href: "/dashboard/staff/services",
        icon: RiFileListLine,
      },
      {
        title: "Completed",
        href: "/dashboard/staff/completed",
        icon: RiCheckboxCircleLine,
      },
      {
        title: "Sparepart",
        href: "/dashboard/staff/sparepart",
        icon: RiToolsLine,
      },
    ],
  },
  technician: {
    groupLabel: "Technician Menu",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard/technician",
        icon: RiDashboardLine,
      },
      {
        title: "Tasks / Servisan",
        href: "/dashboard/technician/tasks",
        icon: RiToolsLine,
      },
    ],
  },
};

export function RoleSidebarContent() {
  const { session, isPending } = useAuth();
  const pathname = usePathname();

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
  const config = sidebarConfigs[role] || sidebarConfigs.staff;

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{config.groupLabel}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {config.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
