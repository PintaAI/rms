"use client";

import { useState } from "react";
import { TokoCard } from "@/components/toko/toko-card";
import { TokoDetailSheet } from "@/components/toko/toko-detail-sheet";
import type { Toko } from "@/actions/toko";

interface TokoListClientProps {
  tokoList: Toko[];
}

export function TokoListClient({ tokoList }: TokoListClientProps) {
  const [selectedTokoId, setSelectedTokoId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleTokoClick(tokoId: string) {
    setSelectedTokoId(tokoId);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokoList.map((toko) => (
          <TokoCard key={toko.id} toko={toko} onClick={handleTokoClick} />
        ))}
      </div>
      <TokoDetailSheet
        tokoId={selectedTokoId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}