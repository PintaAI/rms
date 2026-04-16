"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getTokoLimit } from "@/actions/toko";

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 border-gray-200",
  premium: "bg-blue-100 text-blue-600 border-blue-200",
  enterprise: "bg-purple-100 text-purple-600 border-purple-200",
};

const planLabels: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  enterprise: "Enterprise",
};

export function SubscriptionBadge() {
  const [data, setData] = useState<{ plan: string; current: number; limit: number } | null>(null);

  useEffect(() => {
    getTokoLimit().then((result) => {
      if (result.success && result.data) {
        setData(result.data);
      }
    });
  }, []);

  if (!data) return null;

  const limitText = data.limit === -1 ? "∞" : `${data.current}/${data.limit}`;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${planColors[data.plan]} text-xs font-medium`}>
        {planLabels[data.plan]}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {limitText} tokos
      </span>
    </div>
  );
}