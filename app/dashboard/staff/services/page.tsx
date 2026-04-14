"use client";

import { useEffect, useState, useCallback } from "react";
import { useToko } from "@/components/toko/toko-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceTable, type ServiceTableItem } from "@/components/dashboard/service-table";
import {
  getStaffServiceList,
  type ServiceListItem,
} from "@/actions/staff";
import { ServicesForm } from "@/components/staff/services-form";
import { RiAddLine, RiRefreshLine, RiTimeLine, RiPlayCircleLine } from "@remixicon/react";

export default function StaffServicesPage() {
  const { selectedToko } = useToko();
  const [services, setServices] = useState<ServiceTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedToko) {
      setError("No toko selected");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getStaffServiceList(selectedToko.id, undefined, 1, 100);
      if (result.success && result.data) {
        // Filter to show only active services (received + repairing)
        const activeServices = result.data.data.filter(
          (s: ServiceListItem) => s.status === "received" || s.status === "repairing"
        ) as ServiceTableItem[];
        setServices(activeServices);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedToko]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter services by status
  const filteredServices = services.filter((service) => {
    if (filter === "all") return true;
    return service.status === filter;
  });

  // Calculate stats for active services
  const stats = {
    received: services.filter((s) => s.status === "received").length,
    repairing: services.filter((s) => s.status === "repairing").length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">Loading recent transactions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedToko) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-muted-foreground">Select a toko to view services</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Active Services</h1>
          <p className="text-muted-foreground">
            Manage services in progress
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <RiAddLine className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Add/Edit Service Dialog */}
      <ServicesForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
        editData={editingService}
      />

      {/* Stats Cards */}
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
            <div className="text-2xl font-bold">{stats.received}</div>
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
            <div className="text-2xl font-bold">{stats.repairing}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently being repaired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
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
          Received ({stats.received})
        </Button>
        <Button
          variant={filter === "repairing" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("repairing")}
        >
          In Progress ({stats.repairing})
        </Button>
      </div>

      {/* Active Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Services</CardTitle>
            <CardDescription>
              {filteredServices.length} service(s) at {selectedToko.name}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RiRefreshLine className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ServiceTable
            services={filteredServices}
            variant="active"
            showInvoice={true}
            showCreatedBy={true}
            emptyMessage="No active services found"
            onEditClick={(service) => {
              setEditingService(service);
              setDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
