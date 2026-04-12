"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { getAllToko, type Toko } from "@/actions/toko";

interface TokoContextType {
  // Current selected toko
  selectedToko: Toko | null;
  // All available toko list (for admin, this is all toko; for staff/technician, this is their assigned toko)
  tokoList: Toko[];
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Set selected toko (only works for admin)
  setSelectedToko: (toko: Toko | null) => void;
  // Refresh toko list
  refreshTokoList: () => Promise<void>;
  // Check if user can switch toko (admin only)
  canSwitchToko: boolean;
}

const TokoContext = createContext<TokoContextType>({
  selectedToko: null,
  tokoList: [],
  isLoading: true,
  error: null,
  setSelectedToko: () => {},
  refreshTokoList: async () => {},
  canSwitchToko: false,
});

const TOKO_STORAGE_KEY = "selected-toko-id";

interface TokoProviderProps {
  children: ReactNode;
}

export function TokoProvider({ children }: TokoProviderProps) {
  const { session, isPending: isAuthPending } = useAuth();
  const [tokoList, setTokoList] = useState<Toko[]>([]);
  const [selectedToko, setSelectedTokoState] = useState<Toko | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user role from session
  const userRole = (session?.user as any)?.role || null;
  const isAdmin = userRole === "admin";
  const canSwitchToko = isAdmin;

  // Fetch toko list
  const fetchTokoList = useCallback(async () => {
    if (isAuthPending) return;
    
    if (!session) {
      setTokoList([]);
      setSelectedTokoState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAllToko();
      
      if (result.success && result.data) {
        setTokoList(result.data);
        
        // For admin: try to restore previously selected toko from localStorage
        // For staff/technician: auto-select their assigned toko
        if (result.data.length > 0) {
          if (isAdmin) {
            // Admin can switch between toko
            const storedTokoId = localStorage.getItem(TOKO_STORAGE_KEY);
            const storedToko = storedTokoId 
              ? result.data.find(t => t.id === storedTokoId) 
              : null;
            
            // Use stored toko if it exists, otherwise use the first one
            const tokoToSelect = storedToko || result.data[0];
            setSelectedTokoState(tokoToSelect);
            localStorage.setItem(TOKO_STORAGE_KEY, tokoToSelect.id);
          } else {
            // Non-admin users only have one toko (their assigned one)
            setSelectedTokoState(result.data[0]);
          }
        } else {
          setSelectedTokoState(null);
        }
      } else {
        setError(result.error || "Failed to fetch toko list");
        setTokoList([]);
        setSelectedTokoState(null);
      }
    } catch (err) {
      console.error("Error fetching toko list:", err);
      setError("Failed to fetch toko list");
      setTokoList([]);
      setSelectedTokoState(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, isAuthPending, isAdmin]);

  // Initial fetch and when session changes
  useEffect(() => {
    fetchTokoList();
  }, [fetchTokoList]);

  // Set selected toko (with localStorage persistence for admin)
  const setSelectedToko = useCallback((toko: Toko | null) => {
    if (!canSwitchToko) return;
    
    setSelectedTokoState(toko);
    if (toko) {
      localStorage.setItem(TOKO_STORAGE_KEY, toko.id);
    } else {
      localStorage.removeItem(TOKO_STORAGE_KEY);
    }
  }, [canSwitchToko]);

  // Refresh toko list
  const refreshTokoList = useCallback(async () => {
    await fetchTokoList();
  }, [fetchTokoList]);

  return (
    <TokoContext.Provider
      value={{
        selectedToko,
        tokoList,
        isLoading,
        error,
        setSelectedToko,
        refreshTokoList,
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