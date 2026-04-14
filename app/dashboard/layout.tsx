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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}