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
import { RiDashboardLine, RiCalendarLine, RiFileListLine, RiCustomerServiceLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const staffMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "Appointments",
    href: "/dashboard/staff/appointments",
    icon: RiCalendarLine,
  },
  {
    title: "Service Requests",
    href: "/dashboard/staff/requests",
    icon: RiFileListLine,
  },
  {
    title: "Customer Support",
    href: "/dashboard/staff/support",
    icon: RiCustomerServiceLine,
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