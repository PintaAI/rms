"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Toko } from "@/actions/toko";

interface TokoCardProps {
  toko: Toko;
  onClick?: (tokoId: string) => void;
}

export function TokoCard({ toko, onClick }: TokoCardProps) {
  function handleClick() {
    if (onClick) {
      onClick(toko.id);
    }
  }

  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{toko.name}</span>
          <Badge variant={toko.status === "active" ? "default" : "secondary"}>
            {toko.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Created: {new Date(toko.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {toko.address && (
            <div className="text-sm">
              <span className="font-medium">Address: </span>
              <span className="text-muted-foreground">{toko.address}</span>
            </div>
          )}
          {toko.phone && (
            <div className="text-sm">
              <span className="font-medium">Phone: </span>
              <span className="text-muted-foreground">{toko.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        ID: {toko.id}
      </CardFooter>
    </Card>
  );
}