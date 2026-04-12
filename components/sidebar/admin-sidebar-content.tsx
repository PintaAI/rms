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
import { RiDashboardLine, RiBarChart2Line , RiTeamLine,  RiFileListLine, RiStore2Line } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminMenuItems = [
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
];

export function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {adminMenuItems.map((item) => (
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