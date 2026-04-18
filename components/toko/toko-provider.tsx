"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionToko } from "@/lib/auth-types";

export type Toko = SessionToko;

interface TokoContextType {
  selectedToko: Toko | null;
  tokoList: Toko[];
  setSelectedToko: (toko: Toko | null) => void;
  canSwitchToko: boolean;
}

const TokoContext = createContext<TokoContextType | null>(null);

interface TokoProviderProps {
  children: ReactNode;
  tokoList: Toko[];
  canSwitchToko?: boolean;
}

function extractTokoIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/([^\/]+)/);
  if (match && match[1] !== "admin" && match[1] !== "staff" && match[1] !== "technician") {
    return match[1];
  }
  return null;
}

export function TokoProvider({ 
  children, 
  tokoList, 
  canSwitchToko = false 
}: TokoProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const urlTokoId = useMemo(() => extractTokoIdFromPath(pathname), [pathname]);

  const selectedToko = useMemo(() => {
    if (urlTokoId) {
      return tokoList.find((t) => t.id === urlTokoId) ?? null;
    }
    return tokoList[0] ?? null;
  }, [urlTokoId, tokoList]);

  const setSelectedToko = useCallback(
    (toko: Toko | null) => {
      if (!canSwitchToko || !toko) return;
      router.push(`/dashboard/${toko.id}/admin`);
    },
    [canSwitchToko, router]
  );

  return (
    <TokoContext.Provider
      value={{
        selectedToko,
        tokoList,
        setSelectedToko,
        canSwitchToko,
      }}
    >
      {children}
    </TokoContext.Provider>
  );
}

export function useToko() {
  const context = useContext(TokoContext);
  if (!context) {
    throw new Error("useToko must be used within a TokoProvider");
  }
  return context;
}