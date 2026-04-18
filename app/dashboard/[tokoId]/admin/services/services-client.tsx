"use client";

import { useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  getServiceList,
  deleteService,
  getService,
} from "@/actions";
import type { ServiceTableItem } from "@/components/dashboard/service-table/types";
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
  RiToolsLine,
} from "@remixicon/react";

export type { ServiceTableItem } from "@/components/dashboard/service-table/types";

interface AdminServicesClientProps {
  tokoId: string;
  initialServices: ServiceTableItem[];
  initialStats: { received: number; repairing: number };
  initialFilter: "received" | "repairing";
}

export function AdminServicesClient({
  tokoId,
  initialServices,
  initialStats,
  initialFilter,
}: AdminServicesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [services, setServices] = useState<ServiceTableItem[]>(initialServices);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [filter, setFilter] = useState<"received" | "repairing">(initialFilter);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ServiceTaskItem | null>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState(false);
  
  const pendingMutationsRef = useRef(0);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await getServiceList(tokoId, undefined, 1, 200, ["received", "repairing"]);
      if (result.success && result.data) {
        const allData = result.data.data as ServiceTableItem[];
        setServices(allData.filter((s) => s.status === filter));
        setStats({
          received: allData.filter((s) => s.status === "received").length,
          repairing: allData.filter((s) => s.status === "repairing").length,
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [tokoId, filter]);

  const handleFilterChange = useCallback((newFilter: "received" | "repairing") => {
    setFilter(newFilter);
    setServices((prev) => prev.filter((s) => s.status === newFilter));
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", newFilter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleEditClick = (service: ServiceTableItem) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleServiceCreated = useCallback(() => {
    setEditingService(null);
  }, []);

  const handleDeleteService = useCallback(async () => {
    if (!deletingService) return;

    const serviceId = deletingService.id;
    setIsDeleting(true);
    pendingMutationsRef.current += 1;
    
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    setDeletingService(null);

    const result = await deleteService(serviceId);
    setIsDeleting(false);

    if (!result.success) {
      pendingMutationsRef.current -= 1;
      console.error("Failed to delete service:", result.error);
      fetchData();
    }
  }, [deletingService, fetchData]);

  const handleOptimisticCreate = useCallback((tempService: ServiceTableItem) => {
    pendingMutationsRef.current += 1;
    setServices((prev) => [tempService, ...prev]);
    setStats((prev) => ({
      ...prev,
      received: tempService.status === "received" ? prev.received + 1 : prev.received,
      repairing: tempService.status === "repairing" ? prev.repairing + 1 : prev.repairing,
    }));
  }, []);

  const handleOptimisticUpdate = useCallback((updatedService: ServiceTableItem) => {
    pendingMutationsRef.current += 1;
    setServices((prev) => prev.map((s) => s.id === updatedService.id ? updatedService : s));
  }, []);

  const handleRevertCreate = useCallback((tempId: string) => {
    pendingMutationsRef.current -= 1;
    setServices((prev) => prev.filter((s) => s.id !== tempId));
    fetchData(true);
  }, [fetchData]);

  const handleAssignmentChange = () => {
    fetchData(true);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Services</h1>
        </div>
        <Button onClick={() => { setEditingService(null); setDialogOpen(true); }}>
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
        onSuccess={handleServiceCreated}
        editData={editingService}
        tokoId={tokoId}
        onOptimisticCreate={handleOptimisticCreate}
        onOptimisticUpdate={handleOptimisticUpdate}
        onRevertCreate={handleRevertCreate}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Services</CardTitle>
            <CardDescription>
              {services.length} service(s)
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
            services={services}
            preset="adminActive"
            emptyMessage="No active services found"
            onEdit={handleEditClick}
            onDelete={(service) => setDeletingService(service)}
            onAssignTech={handleAssignmentChange}
            tokoId={tokoId}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

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