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
import { RiDashboardLine, RiFileListLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const staffMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "Services",
    href: "/dashboard/staff/services",
    icon: RiFileListLine,
  },
];

export function StaffSidebarContent() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Staff Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {staffMenuItems.map((item) => (
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