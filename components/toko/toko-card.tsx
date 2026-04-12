"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,

} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { RiEditLine, RiMapPinLine, RiPhoneLine,} from "@remixicon/react";
import { useToko } from "./toko-provider";
import { TokoDetailSheet } from "./toko-detail-sheet";
import type { Toko } from "@/actions/toko";

interface TokoCardProps {
  toko: Toko;
  onSuccess?: () => void;
}

export function TokoCard({ toko, onSuccess }: TokoCardProps) {
  const router = useRouter();
  const { setSelectedToko } = useToko();
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  function handleCardClick() {
    setSelectedToko(toko);
    router.push("/dashboard/admin");
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditSheetOpen(true);
  }

  const formattedDate = new Date(toko.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/30"
        onClick={handleCardClick}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <CardContent className="space-y-4">
          {/* Header section */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg tracking-tight truncate">
                {toko.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formattedDate}
              </p>
            </div>

          </div>

          {/* Details section */}
          <div className="space-y-2.5">
            {toko.address && (
              <div className="flex items-start gap-2.5 text-sm">
                <RiMapPinLine className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground line-clamp-2">
                  {toko.address}
                </span>
              </div>
            )}
            {toko.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <RiPhoneLine className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{toko.phone}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Edit button - visible on hover */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 hover:bg-background"
          onClick={handleEditClick}
          title="Edit Toko"
        >
          <RiEditLine className="h-4 w-4" />
        </Button>
      </Card>

      {/* Edit Sheet */}
      <TokoDetailSheet
        tokoId={toko.id}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
