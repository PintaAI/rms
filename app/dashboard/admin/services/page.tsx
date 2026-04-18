"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  getServiceList,
  deleteService,
  getService,
  type ServiceListItem,
} from "@/actions";
import type { ServiceTableItem as ServiceTableItemType } from "@/components/dashboard/service-table/types";
import { ServicesForm } from "@/components/staff/services-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServiceTaskCard, type ServiceTaskItem } from "@/components/technician/service-task-card";
import {
  RiAddLine,
  RiRefreshLine,
  RiTimeLine,
  RiPlayCircleLine,
  RiStore2Line,
  RiToolsLine,
} from "@remixicon/react";

export default function AdminServicesPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [services, setServices] = useState<ServiceTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "received" || statusParam === "repairing") {
      return statusParam;
    }
    return "received";
  });
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);

  // Delete state
  const [deletingService, setDeletingService] = useState<ServiceTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Technician task detail sheet state
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ServiceTaskItem | null>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState(false);
  
  // Track pending mutations to prevent fetchData from being called after optimistic update
  const pendingMutationsRef = useRef(0);

  const fetchData = useCallback(async (silent = false) => {
    if (!selectedToko) {
      setError("No toko selected");
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await getServiceList(selectedToko.id, undefined, 1, 200);
      if (result.success && result.data) {
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
      if (!silent) setIsLoading(false);
    }
  }, [selectedToko]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync filter with URL param changes
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "received" || statusParam === "repairing") {
      setFilter(statusParam);
    } else {
      setFilter("received");
    }
  }, [searchParams]);

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

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", newFilter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Handle edit
  const handleEditClick = (service: ServiceTableItem) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  // Handle service created/updated - don't refetch, optimistic state is already correct
  const handleServiceCreated = useCallback(() => {
    setEditingService(null);
    // Don't call fetchData - optimistic state is already correct
  }, []);

  // Handle delete
  const handleDeleteService = useCallback(async () => {
    if (!deletingService) return;

    const serviceId = deletingService.id;
    setIsDeleting(true);
    
    // Track pending mutation
    pendingMutationsRef.current += 1;
    
    // Optimistic update - remove from local state immediately
    setServices(prev => prev.filter(s => s.id !== serviceId));
    setDeletingService(null);

    const result = await deleteService(serviceId);
    setIsDeleting(false);

    if (!result.success) {
      // Revert on failure - decrement counter and refetch
      pendingMutationsRef.current -= 1;
      console.error("Failed to delete service:", result.error);
      fetchData();
    }
  }, [deletingService, fetchData]);

  // Handle optimistic create - add service immediately to local state
  const handleOptimisticCreate = useCallback((tempService: ServiceTableItemType) => {
    pendingMutationsRef.current += 1;
    setServices(prev => [tempService, ...prev]);
  }, []);

  // Handle optimistic update - update service immediately in local state
  const handleOptimisticUpdate = useCallback((updatedService: ServiceTableItemType) => {
    pendingMutationsRef.current += 1;
    setServices(prev => prev.map(s => 
      s.id === updatedService.id ? updatedService : s
    ));
  }, []);

  // Handle revert create - remove temp service on failure
  const handleRevertCreate = useCallback((tempId: string) => {
    pendingMutationsRef.current -= 1;
    setServices(prev => prev.filter(s => s.id !== tempId));
    fetchData(true);
  }, [fetchData]);

  // Handle technician assignment change
  const handleAssignmentChange = () => {
    fetchData(true); // silent reload
  };

  // Handle row click - open task detail sheet
  const handleRowClick = async (service: ServiceTableItem) => {
    setIsLoadingTaskDetail(true);
    setTaskSheetOpen(true);
    
    try {
      const result = await getService(service.id);
      if (result.success && result.data) {
        setSelectedTaskDetail(result.data);
      } else {
        console.error("Failed to load task detail:", result.error);
        setTaskSheetOpen(false);
      }
    } catch (err) {
      console.error("Error loading task detail:", err);
      setTaskSheetOpen(false);
    } finally {
      setIsLoadingTaskDetail(false);
    }
  };

  // Loading state
  if (isLoading || tokoLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold">
          {tokoLoading ? "Loading toko data..." : "Loading services..."}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {tokoLoading ? "Fetching your store information" : "Fetching service list"}
        </p>
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

  // No toko selected (after loading complete)
  if (!selectedToko) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiStore2Line className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Toko Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please select a toko from the sidebar to manage services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Services</h1>
          <p className="text-muted-foreground">
            Manage active services at {selectedToko.name}
          </p>
        </div>
        <Button onClick={() => { setEditingService(null); setDialogOpen(true); }}>
          <RiAddLine className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Add/Edit Service Dialog */}
      <ServicesForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingService(null);
          }
        }}
        onSuccess={handleServiceCreated}
        editData={editingService}
        tokoId={selectedToko?.id}
        onOptimisticCreate={handleOptimisticCreate}
        onOptimisticUpdate={handleOptimisticUpdate}
        onRevertCreate={handleRevertCreate}
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
          variant={filter === "received" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("received")}
          className="relative"
        >
          <RiTimeLine className="h-4 w-4" />
          Masuk
          {stats.received > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white tabular-nums">
              {stats.received}
            </span>
          )}
        </Button>
        <Button
          variant={filter === "repairing" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("repairing")}
          className="relative"
        >
          <RiPlayCircleLine className="h-4 w-4" />
          Sedang di service
          {stats.repairing > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white tabular-nums">
              {stats.repairing}
            </span>
          )}
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
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            <RiRefreshLine className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ServiceTable
            services={filteredServices}
            preset="adminActive"
            emptyMessage="No active services found"
            onEdit={handleEditClick}
            onDelete={(service) => setDeletingService(service)}
            onAssignTech={handleAssignmentChange}
            tokoId={selectedToko?.id}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this service for {deletingService?.customerName || "Unknown Customer"}?
            This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} disabled={isDeleting} variant="destructive">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Technician Task Detail Sheet */}
      <Sheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-4xl h-[85vh] sm:max-w-2xl mx-auto overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <RiToolsLine className="h-5 w-5" />
              Technician Task Detail
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {isLoadingTaskDetail ? (
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
                <div className="h-48 bg-muted rounded animate-pulse" />
              </div>
            ) : selectedTaskDetail ? (
              <ServiceTaskCard
                task={selectedTaskDetail}
                variant="active"
                onRefresh={() => {
                  fetchData(true);
                  if (selectedTaskDetail) {
                    getService(selectedTaskDetail.id).then((result) => {
                      if (result.success && result.data) {
                        setSelectedTaskDetail(result.data);
                      }
                    });
                  }
                }}
                onStatusChange={(status) => {
                  if (status === "done" || status === "failed") {
                    setTaskSheetOpen(false);
                  }
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No task detail available
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
