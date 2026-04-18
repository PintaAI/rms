"use client";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  RoleSidebarContent,
  SidebarHeaderComponent,
  SidebarFooterComponent,
} from "@/components/sidebar";
import { TokoProvider } from "@/components/toko/toko-provider";
import type { SessionToko } from "@/lib/auth-types";

export type Toko = SessionToko;

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  tokoList: Toko[];
  isAdmin: boolean;
}

export function DashboardLayoutClient({ 
  children, 
  tokoList, 
  isAdmin,
}: DashboardLayoutClientProps) {
  return (
    <TokoProvider 
      tokoList={tokoList} 
      canSwitchToko={isAdmin}
    >
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeaderComponent />
          <RoleSidebarContent />
          <SidebarFooterComponent />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TokoProvider>
  );
}