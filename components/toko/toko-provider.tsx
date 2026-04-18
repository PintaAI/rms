"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/components/auth-provider";
import { getAllToko, type Toko } from "@/actions/toko";

type UserRole = "admin" | "staff" | "technician";

interface TokoContextType {
  selectedToko: Toko | null;
  tokoList: Toko[];
  isLoading: boolean;
  error: string | null;
  setSelectedToko: (toko: Toko | null) => void;
  refreshTokoList: () => Promise<void>;
  forceRefreshTokoList: () => Promise<void>;
  canSwitchToko: boolean;
}

const TokoContext = createContext<TokoContextType>({
  selectedToko: null,
  tokoList: [],
  isLoading: true,
  error: null,
  setSelectedToko: () => {},
  refreshTokoList: async () => {},
  forceRefreshTokoList: async () => {},
  canSwitchToko: false,
});

const TOKO_STORAGE_KEY = "selected-toko-id";
const TOKO_CACHE_KEY = "toko-cache";
const SWR_KEY = "toko-list";
const CACHE_DURATION_MS = 60 * 60 * 1000;

interface TokoCache {
  data: Toko[];
  timestamp: number;
  userId: string;
}

function getTokoCache(userId: string): TokoCache | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(TOKO_CACHE_KEY);
  if (!stored) return null;
  try {
    const cache: TokoCache = JSON.parse(stored);
    if (cache.userId !== userId) {
      localStorage.removeItem(TOKO_CACHE_KEY);
      localStorage.removeItem(TOKO_STORAGE_KEY);
      return null;
    }
    if (Date.now() - cache.timestamp < CACHE_DURATION_MS) {
      return cache;
    }
    localStorage.removeItem(TOKO_CACHE_KEY);
    return null;
  } catch {
    localStorage.removeItem(TOKO_CACHE_KEY);
    localStorage.removeItem(TOKO_STORAGE_KEY);
    return null;
  }
}

function setTokoCache(data: Toko[], userId: string): void {
  if (typeof window === "undefined") return;
  const cache: TokoCache = { data, timestamp: Date.now(), userId };
  localStorage.setItem(TOKO_CACHE_KEY, JSON.stringify(cache));
}

const fetcher = async (userId: string) => {
  const result = await getAllToko();
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch toko list");
  }
  setTokoCache(result.data, userId);
  return result.data;
};

function getLastFetchTime(userId: string): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(TOKO_CACHE_KEY);
  if (!stored) return 0;
  try {
    const cache: TokoCache = JSON.parse(stored);
    if (cache.userId !== userId) return 0;
    return cache.timestamp;
  } catch {
    return 0;
  }
}

function isCacheValid(userId: string): boolean {
  return Date.now() - getLastFetchTime(userId) < CACHE_DURATION_MS;
}

interface TokoProviderProps {
  children: ReactNode;
}

function getStoredTokoId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKO_STORAGE_KEY);
}

function setStoredTokoId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(TOKO_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(TOKO_STORAGE_KEY);
  }
}

export function TokoProvider({ children }: TokoProviderProps) {
  const { session, isPending: isAuthPending } = useAuth();
  const currentUserId = session?.user?.id || null;
  const [manualSelectionId, setManualSelectionId] = useState<string | null>(() => getStoredTokoId());
  const cachedTokoList = useMemo(() => {
    if (!currentUserId) return undefined;
    return getTokoCache(currentUserId)?.data || undefined;
  }, [currentUserId]);

  const userRole = (session?.user as { role?: UserRole })?.role || null;
  const isAdmin = userRole === "admin";
  const canSwitchToko = isAdmin;

  const shouldFetch = !isAuthPending && session && currentUserId && !isCacheValid(currentUserId);
  const { data: tokoList, error, isLoading, isValidating } = useSWR(
    shouldFetch ? [SWR_KEY, currentUserId] : null,
    ([_, userId]) => fetcher(userId),
    {
      dedupingInterval: 3600000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      fallbackData: cachedTokoList,
    }
  );

  const selectedToko = useMemo(() => {
    if (!tokoList || tokoList.length === 0) return null;

    const selectedId = manualSelectionId;
    if (selectedId) {
      const found = tokoList.find((t) => t.id === selectedId);
      if (found) return found;
    }

    return tokoList[0];
  }, [tokoList, manualSelectionId]);

  const setSelectedToko = useCallback(
    (toko: Toko | null) => {
      if (!canSwitchToko) return;
      const newId = toko?.id || null;
      setManualSelectionId(newId);
      setStoredTokoId(newId);
    },
    [canSwitchToko]
  );

  const refreshTokoList = useCallback(async () => {
    if (!currentUserId || isCacheValid(currentUserId)) {
      return;
    }
    await mutate([SWR_KEY, currentUserId]);
  }, [currentUserId]);

  const forceRefreshTokoList = useCallback(async () => {
    if (!currentUserId) return;
    localStorage.removeItem(TOKO_CACHE_KEY);
    await mutate([SWR_KEY, currentUserId]);
  }, [currentUserId]);

  const computedIsLoading = isLoading || isValidating || isAuthPending || !tokoList;

  return (
    <TokoContext.Provider
      value={{
        selectedToko,
        tokoList: tokoList || [],
        isLoading: computedIsLoading,
        error: error?.message || null,
        setSelectedToko,
        refreshTokoList,
        forceRefreshTokoList,
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

export function clearTokoCacheOnSignIn(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKO_CACHE_KEY);
  localStorage.removeItem(TOKO_STORAGE_KEY);
}