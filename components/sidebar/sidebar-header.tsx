"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import { useToko } from "@/components/toko/toko-provider";
import { useRouter } from "next/navigation";
import { RiStore2Line, RiArrowDownSLine, RiCheckLine, RiSettings4Line } from "@remixicon/react";

export function SidebarHeaderComponent() {
  const { session } = useAuth();
  const { selectedToko, tokoList, setSelectedToko, canSwitchToko, isLoading } = useToko();
  const router = useRouter();
  
  if (!session) {
    return null;
  }

  const role = (session.user as any).role || "staff";

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          {canSwitchToko && tokoList.length > 0 ? (
            // Admin: Show toko selector dropdown
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isLoading}
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <RiStore2Line className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="font-semibold">
                        {isLoading ? "Loading..." : selectedToko?.name || "Select Toko"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tokoList.length} toko available
                      </span>
                    </div>
                    <RiArrowDownSLine className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className="min-w-[200px]"
                align="start"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Toko</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tokoList.map((toko) => (
                    <DropdownMenuItem
                      key={toko.id}
                      className="gap-3 p-3"
                      onClick={() => setSelectedToko(toko)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <RiStore2Line className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{toko.name}</span>
                        {toko.address && (
                          <span className="text-xs text-muted-foreground">{toko.address}</span>
                        )}
                      </div>
                      {selectedToko?.id === toko.id && (
                        <RiCheckLine className="size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => router.push("/dashboard")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <RiSettings4Line className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">Manage Toko</span>
                    <span className="text-xs text-muted-foreground">View all settings</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // No toko assigned or non-switchable: Show dropdown with manage option
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isLoading}
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <RiStore2Line className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="font-semibold">
                        {isLoading ? "Loading..." : selectedToko?.name || "No Toko Assigned"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                    <RiArrowDownSLine className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className="min-w-[200px]"
                align="start"
              >
                <DropdownMenuItem
                  className="gap-3 cursor-pointer"
                  onClick={() => router.push("/dashboard")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <RiSettings4Line className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">Manage Toko</span>
                    <span className="text-xs text-muted-foreground">Go to dashboard to manage</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}