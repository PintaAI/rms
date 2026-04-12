"use client";

import { useState } from "react";
import { TokoCard } from "@/components/toko/toko-card";
import { TokoDetailSheet } from "@/components/toko/toko-detail-sheet";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "@remixicon/react";
import type { Toko } from "@/actions/toko";

interface TokoListClientProps {
  tokoList: Toko[];
  onSuccess?: () => void;
}

export function TokoListClient({ tokoList, onSuccess }: TokoListClientProps) {
  const [selectedTokoId, setSelectedTokoId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleCreateClick() {
    setSelectedTokoId(null);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreateClick}>
          <RiAddLine className="h-4 w-4 mr-2" />
          Add Toko
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokoList.map((toko) => (
          <TokoCard key={toko.id} toko={toko} onSuccess={onSuccess} />
        ))}
      </div>
      <TokoDetailSheet
        tokoId={selectedTokoId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}