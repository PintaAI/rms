"use client";

import Link from "next/link";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/auth-client";
import { RiLogoutBoxRLine, RiUser3Line, RiArrowUpSLine, RiPaletteLine, RiBookOpenLine } from "@remixicon/react";
import { ModeToggle } from "@/components/theme-toggle";

export function SidebarFooterComponent() {
  const { session, isPending } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Force a full page refresh to clear all client-side state
    window.location.href = "/auth";
  };

  if (isPending) {
    return (
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="opacity-50">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-2 w-16 bg-muted animate-pulse rounded" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const role = (user as any).role || "staff";

  return (
    <>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="aspect-square size-8 rounded-full"
                      />
                    ) : (
                      <div className="aspect-square size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
                        {(user.name || user.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="font-medium">{user.name || user.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{role}</span>
                    </div>
                    <RiArrowUpSLine className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="top"
                className="min-w-[200px]"
              >
                <DropdownMenuItem className="flex items-center gap-2 h-10">
                  <RiUser3Line className="h-4 w-4" />
                  <span>{user.name || user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 h-10">
                  <Link href="/user-documentation" className="flex items-center gap-2 w-full">
                    <RiBookOpenLine className="h-4 w-4" />
                    <span>Lihat Panduan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 h-10">
                  <RiPaletteLine className="h-4 w-4" />
                  <span className="flex-1">Theme</span>
                  <ModeToggle />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 h-10 text-destructive focus:text-destructive cursor-pointer"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}