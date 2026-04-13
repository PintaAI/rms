"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TokoCard } from "@/components/toko/toko-card";
import { TokoDetailSheet } from "@/components/toko/toko-detail-sheet";
import { Card, CardContent } from "@/components/ui/card";
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
}

export function TokoListClient({ tokoList }: TokoListClientProps) {
  const router = useRouter();
  const [selectedTokoId, setSelectedTokoId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleCreateClick() {
    setSelectedTokoId(null);
    setSheetOpen(true);
  }

  function handleSuccess() {
    router.refresh();
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
          <Card
            className="mt-4 cursor-pointer border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
            onClick={handleCreateClick}
          >
            <CardContent className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <RiAddLine className="h-5 w-5" />
                <span className="font-medium">Add New Toko</span>
              </div>
            </CardContent>
          </Card>
        </Empty>
        <TokoDetailSheet
          tokoId={selectedTokoId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={handleSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full"
          onClick={handleCreateClick}
        >
          <CardContent className="flex flex-col items-center justify-center gap-2 w-full">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <RiAddLine className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="font-medium text-muted-foreground">Add New Toko</span>
          </CardContent>
        </Card>
        {tokoList.map((toko) => (
          <TokoCard key={toko.id} toko={toko} onSuccess={handleSuccess} />
        ))}
      </div>
      <TokoDetailSheet
        tokoId={selectedTokoId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}