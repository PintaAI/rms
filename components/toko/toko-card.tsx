"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiEditLine, RiMapPinLine, RiPhoneLine, RiStore2Line } from "@remixicon/react";
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
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border border-border/40 hover:border-primary/40 hover:bg-card/80 w-full bg-card/60 backdrop-blur-sm"
        onClick={handleCardClick}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <CardContent >
          {/* Logo and Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm flex items-center justify-center">
                {toko.logoUrl ? (
                  <img
                    src={toko.logoUrl}
                    alt={`${toko.name} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <RiStore2Line className="h-7 w-7 text-primary/60" />
                )}
              </div>
              {/* Status indicator */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  toko.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
                title={toko.status === "active" ? "Active" : "Inactive"}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base tracking-tight truncate text-card-foreground">
                  {toko.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground/80 font-medium">
                Est. {formattedDate}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            {toko.address && (
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground/90">
                <RiMapPinLine className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">
                  {toko.address}
                </span>
              </div>
            )}
            {toko.phone && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground/90">
                <RiPhoneLine className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span className="font-mono">{toko.phone}</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Edit button - visible on hover */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 hover:bg-background/90 shadow-md"
          onClick={handleEditClick}
          title="Edit Toko"
        >
          <RiEditLine className="h-3.5 w-3.5" />
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
