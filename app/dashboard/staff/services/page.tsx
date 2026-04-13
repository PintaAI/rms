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
import { ServiceTable } from "@/components/dashboard/service-table";
import {
  getStaffServiceList,
  type ServiceListItem,
} from "@/actions/dashboard";
import { AddServiceForm } from "@/components/staff/add-service-form";
import { RiAddLine, RiRefreshLine } from "@remixicon/react";

export default function StaffServicesPage() {
  const { selectedToko } = useToko();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedToko) {
      setError("No toko selected");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getStaffServiceList(selectedToko.id);
      if (result.success && result.data) {
        setServices(result.data);
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
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Recent service transactions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <RiAddLine className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Add Service Dialog */}
      <AddServiceForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />

      {/* All Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Services</CardTitle>
            <CardDescription>
              {services.length} service requests at {selectedToko.name}
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
            services={services}
            showInvoice={true}
            showCreatedBy={true}
            emptyMessage="No services found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
