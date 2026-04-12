"use client";

import { useCallback, useState, useEffect } from "react";
import { useToko } from "@/components/toko/toko-provider";
import { TokoListClient } from "@/components/toko/toko-list-client";
import { getAllToko, type Toko } from "@/actions/toko";

export default function KelolaTokoPage() {
  const { tokoList: providerTokoList, refreshTokoList } = useToko();
  const [tokoList, setTokoList] = useState<Toko[]>(providerTokoList);
  const [isLoading, setIsLoading] = useState(true);

  const fetchToko = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllToko();
    if (result.success && result.data) {
      setTokoList(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchToko();
  }, [fetchToko]);

  const handleSuccess = useCallback(async () => {
    await fetchToko();
    await refreshTokoList();
  }, [fetchToko, refreshTokoList]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Toko</h1>
          <p className="text-muted-foreground">Manage all your stores.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg border animate-pulse bg-muted/50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Toko</h1>
        <p className="text-muted-foreground">Manage all your stores.</p>
      </div>
      <TokoListClient tokoList={tokoList} onSuccess={handleSuccess} />
    </div>
  );
}
