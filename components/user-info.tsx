"use client";

import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RiLogoutBoxRLine, RiUser3Line } from "@remixicon/react";
import { ModeToggle } from "@/components/theme-toggle";

export function UserInfo() {
  const { session, isPending } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Force a full page refresh to clear all client-side state
    window.location.href = "/auth";
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const role = (user as any).role || "staff";

  const roleVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    admin: "destructive",
    staff: "secondary",
    technician: "default",
  };

  const roleVariant = roleVariants[role] || "secondary";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity outline-none">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">{user.name || user.email}</span>
          <Badge variant={roleVariant} className="text-xs capitalize">{role}</Badge>
        </div>
        <Avatar>
          {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
          <AvatarFallback>
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="flex items-center gap-2">
          <RiUser3Line className="h-4 w-4" />
          <span>{user.name || user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">Theme</span>
          <ModeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <RiLogoutBoxRLine className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}