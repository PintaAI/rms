"use client";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DynamicSidebarContent,
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
        <DynamicSidebarContent />
        <SidebarFooterComponent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}