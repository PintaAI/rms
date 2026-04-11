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
import { RiDashboardLine, RiToolsLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const technicianMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "Tasks / Servisan",
    href: "/dashboard/technician/tasks",
    icon: RiToolsLine,
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