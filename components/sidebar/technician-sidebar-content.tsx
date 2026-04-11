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
import { RiDashboardLine, RiToolsLine, RiCalendarLine, RiFileListLine, RiMapPinLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const technicianMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "My Tasks",
    href: "/dashboard/technician/tasks",
    icon: RiToolsLine,
  },
  {
    title: "Schedule",
    href: "/dashboard/technician/schedule",
    icon: RiCalendarLine,
  },
  {
    title: "Work Orders",
    href: "/dashboard/technician/work-orders",
    icon: RiFileListLine,
  },
  {
    title: "Locations",
    href: "/dashboard/technician/locations",
    icon: RiMapPinLine,
  },
];

export function TechnicianSidebarContent() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Technician Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {technicianMenuItems.map((item) => (
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