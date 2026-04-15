"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  deleteService,
} from "@/actions/staff";
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
import { TechnicianAssignmentDialog } from "@/components/admin/technician-assignment-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServiceTaskCard, type ServiceTaskItem } from "@/components/technician/service-task-card";
import {
  getAdminTechnicianTaskDetail,
} from "@/actions/dashboard";
import {
  RiAddLine,
  RiRefreshLine,
  RiTimeLine,
  RiPlayCircleLine,
  RiStore2Line,
  RiToolsLine,
} from "@remixicon/react";

export default function AdminServicesPage() {
  const { selectedToko } = useToko();
  const [services, setServices] = useState<ServiceTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);

  // Delete state
  const [deletingService, setDeletingService] = useState<ServiceTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Technician assignment state
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [selectedTechService, setSelectedTechService] = useState<{
    id: string;
    technician: { id: string; name: string } | null;
  } | null>(null);

  // Technician task detail sheet state
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ServiceTaskItem | null>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedToko) {
      setError("No toko selected");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getStaffServiceList(selectedToko.id, undefined, 1, 200);
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

  // Handle edit
  const handleEditClick = (service: ServiceTableItem) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  // Handle service created/updated
  const handleServiceCreated = useCallback(() => {
    setEditingService(null);
    fetchData();
  }, [fetchData]);

  // Handle delete
  const handleDeleteService = useCallback(async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    const result = await deleteService(deletingService.id);
    setIsDeleting(false);

    if (result.success) {
      setDeletingService(null);
      fetchData();
    } else {
      console.error("Failed to delete service:", result.error);
    }
  }, [deletingService, fetchData]);

  // Handle technician click
  const handleTechnicianClick = (service: ServiceTableItem) => {
    setSelectedTechService({
      id: service.id,
      technician: service.technician && service.technician.id
        ? { id: service.technician.id, name: service.technician.name }
        : null,
    });
    setTechDialogOpen(true);
  };

  const handleAssignmentChange = () => {
    fetchData();
  };

  // Handle row click - open task detail sheet for services with technician
  const handleRowClick = async (service: ServiceTableItem) => {
    // Only open task sheet for services that have a technician assigned
    if (!service.technician?.id) return;
    
    setIsLoadingTaskDetail(true);
    setTaskSheetOpen(true);
    
    try {
      const result = await getAdminTechnicianTaskDetail(service.id);
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
            <div className="text-center text-muted-foreground">Loading services...</div>
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

  // No toko selected
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
            onEditClick={handleEditClick}
            onDeleteClick={(service) => setDeletingService(service)}
            onTechnicianClick={handleTechnicianClick}
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

      {/* Technician Assignment Dialog */}
      {selectedTechService && selectedToko && (
        <TechnicianAssignmentDialog
          open={techDialogOpen}
          onOpenChange={setTechDialogOpen}
          serviceId={selectedTechService.id}
          tokoId={selectedToko.id}
          currentTechnician={selectedTechService.technician}
          onAssignmentChange={handleAssignmentChange}
        />
      )}

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
                  fetchData();
                  // Also refresh the task detail
                  if (selectedTaskDetail) {
                    getAdminTechnicianTaskDetail(selectedTaskDetail.id).then((result) => {
                      if (result.success && result.data) {
                        setSelectedTaskDetail(result.data);
                      }
                    });
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
