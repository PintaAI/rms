"use client";

import { useState } from "react";
import { TokoCard } from "@/components/toko/toko-card";
import { TokoDetailSheet } from "@/components/toko/toko-detail-sheet";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { RiAddLine, RiStore2Line } from "@remixicon/react";
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

  if (tokoList.length === 0) {
    return (
      <>
        <Empty className="border-2 border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiStore2Line />
            </EmptyMedia>
            <EmptyTitle>No Toko Found</EmptyTitle>
            <EmptyDescription>
              Get started by creating your first toko.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={handleCreateClick} className="mt-4">
            <RiAddLine className="h-4 w-4 mr-2" />
            Add Toko
          </Button>
        </Empty>
        <TokoDetailSheet
          tokoId={selectedTokoId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={onSuccess}
        />
      </>
    );
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