"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceTable, type ServiceTableItem } from "@/components/dashboard/service-table";
import { ServicesForm } from "@/components/staff/services-form";
import { RiAddLine, RiRefreshLine, RiTimeLine, RiPlayCircleLine } from "@remixicon/react";

interface StaffServicesOverviewProps {
  initialServices: ServiceTableItem[];
  initialStats: {
    received: number;
    repairing: number;
  };
  tokoId: string;
  tokoName: string;
}

export function StaffServicesOverview({
  initialServices,
  initialStats,
  tokoId,
  tokoName,
}: StaffServicesOverviewProps) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceTableItem[]>(initialServices);
  const [stats, setStats] = useState(initialStats);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setIsRefreshing(false);
  }, [router]);

  const handleSuccess = () => {
    refreshData();
    setEditingService(null);
  };

  const filteredServices = services.filter((service) => {
    if (filter === "all") return true;
    return service.status === filter;
  });

  const currentStats = {
    received: services.filter((s) => s.status === "received").length,
    repairing: services.filter((s) => s.status === "repairing").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Active Services</h1>
          <p className="text-muted-foreground">Manage services in progress</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <RiAddLine className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      <ServicesForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        onSuccess={handleSuccess}
        editData={editingService}
        tokoId={tokoId}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Received
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <RiTimeLine className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.received}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting to be processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <RiPlayCircleLine className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.repairing}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently being repaired</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({services.length})
        </Button>
        <Button
          variant={filter === "received" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("received")}
        >
          Received ({currentStats.received})
        </Button>
        <Button
          variant={filter === "repairing" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("repairing")}
        >
          In Progress ({currentStats.repairing})
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Services</CardTitle>
            <CardDescription>
              {filteredServices.length} service(s) at {tokoName}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RiRefreshLine className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <ServiceTable
            services={filteredServices}
            preset="staffActive"
            emptyMessage="No active services found"
            onEdit={(service) => {
              setEditingService(service);
              setDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}