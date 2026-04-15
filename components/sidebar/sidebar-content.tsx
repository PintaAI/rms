"use client";

import { useEffect, useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  RiDashboardLine,
  RiTeamLine,
  RiFileListLine,
  RiStore2Line,
  RiToolsLine,
  RiCheckboxCircleLine,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToko } from "@/components/toko/toko-provider";
import { getCompletedServiceCounts } from "@/actions/dashboard";

export type SidebarMenuItemConfig = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SidebarMenuItemConfig[];
  badge?: {
    key: string;
  };
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
        title: "Services",
        href: "/dashboard/admin/services",
        icon: RiFileListLine,
        children: [
          {
            title: "Completed",
            href: "/dashboard/admin/completed",
            icon: RiCheckboxCircleLine,
            badge: { key: "completed" },
          },
        ],
      },
      {
        title: "Kelola Toko",
        href: "/dashboard/admin/toko",
        icon: RiStore2Line,
        children: [
          {
            title: "Staff & Teknisi",
            href: "/dashboard/admin/karyawan",
            icon: RiTeamLine,
          },
          {
            title: "Sparepart & Jasa",
            href: "/dashboard/admin/inventory",
            icon: RiToolsLine,
          },
        ],
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
        badge: { key: "completed" },
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
  const { selectedToko } = useToko();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!session || !selectedToko) return;

    getCompletedServiceCounts(selectedToko.id).then((result) => {
      if (result.success && result.data) {
        setBadgeCounts({
          completed: result.data.total,
        });
      }
    });
  }, [session, selectedToko]);

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
                {item.badge && badgeCounts[item.badge.key] != null && (
                  <SidebarMenuBadge>
                    {badgeCounts[item.badge.key]}
                  </SidebarMenuBadge>
                )}
                {item.children && item.children.length > 0 && (
                  <SidebarMenuSub>
                    {item.children.map((child) => (
                      <SidebarMenuSubItem key={child.href}>
                        <SidebarMenuSubButton
                          render={<Link href={child.href} />}
                          isActive={pathname === child.href}
                        >
                          <child.icon />
                          <span>{child.title}</span>
                          {child.badge &&
                            badgeCounts[child.badge.key] != null &&
                            badgeCounts[child.badge.key] > 0 && (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary tabular-nums">
                                {badgeCounts[child.badge.key]}
                              </span>
                            )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
