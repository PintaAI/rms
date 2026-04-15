"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTechnicianDashboardData,
  technicianTakeService,
  type TechnicianDashboardData,
  type RecentService,
  type TechnicianTaskService,
} from "@/actions/dashboard";
import { ServiceTable, type ServiceTableItem } from "@/components/dashboard/service-table";
import { ServiceTaskCard, type ServiceTaskItem } from "@/components/technician/service-task-card";
import {
  RiSmartphoneLine,
  RiToolsLine,
  RiUserLine,
  RiPhoneLine,
  RiCellphoneLine,
  RiChatQuoteLine,
  RiTimeLine,
  RiUserStarLine,
  RiPlayCircleLine,
  RiCheckLine,
  RiFileList3Line,
} from "@remixicon/react";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function TechnicianOverview() {
  const [dashboardData, setDashboardData] = useState<TechnicianDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingServiceId, setTakingServiceId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<RecentService | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTaskService, setSelectedTaskService] = useState<TechnicianTaskService | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    // silent = true: background re-fetch after an optimistic mutation.
    // Skip setIsLoading so the page stays mounted and optimistic state is preserved.
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const result = await getTechnicianDashboardData();
      if (result.success && result.data) {
        setDashboardData(result.data);

        // Keep selectedTaskService in sync with the fresh server data so
        // the ServiceTaskCard inside the Sheet receives an up-to-date
        // `task` prop after a silent re-fetch.
        setSelectedTaskService((prev) => {
          if (!prev) return prev;
          const fresh = result.data!.myTasks.find((t) => t.id === prev.id);
          return fresh ?? null;
        });
      } else {
        setError(result.error || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle taking a service
  const handleTakeService = async (serviceId: string) => {
    setTakingServiceId(serviceId);
    try {
      const result = await technicianTakeService(serviceId);
      if (result.success) {
        // Silent re-fetch to sync with server
        fetchDashboardData(true);
      } else {
        setError(result.error || "Failed to take service");
      }
    } catch (err) {
      console.error("Error taking service:", err);
      setError("Failed to take service");
    } finally {
      setTakingServiceId(null);
    }
  };

  // Convert TechnicianTaskService to ServiceTaskItem for ServiceTaskCard
  const taskItems: ServiceTaskItem[] = useMemo(() => {
    return (dashboardData?.myTasks || []).map((task) => ({
      id: task.id,
      customerName: task.customerName,
      noWa: task.noWa,
      complaint: task.complaint,
      status: task.status,
      checkinAt: task.checkinAt,
      doneAt: task.doneAt,
      passwordPattern: task.passwordPattern,
      imei: task.imei,
      hpCatalog: task.hpCatalog,
      items: task.items,
      invoice: task.invoice,
    }));
  }, [dashboardData?.myTasks]);

  // Convert availableServices to ServiceTableItem format
  const availableServicesTableItems: ServiceTableItem[] = useMemo(() => {
    return (dashboardData?.availableServices || []).map((service) => ({
      id: service.id,
      hpCatalogId: service.hpCatalogId,
      customerName: service.customerName,
      noWa: service.noWa,
      complaint: service.complaint,
      status: service.status,
      checkinAt: service.checkinAt,
      passwordPattern: service.passwordPattern,
      imei: service.imei,
      hpCatalog: service.hpCatalog,
      technician: service.technician,
      invoice: service.invoice,
      createdBy: service.createdBy,
    }));
  }, [dashboardData?.availableServices]);

  // Convert myTasks to ServiceTableItem format
  const myTasksTableItems: ServiceTableItem[] = useMemo(() => {
    return (dashboardData?.myTasks || []).map((task) => ({
      id: task.id,
      hpCatalogId: task.hpCatalog.id,
      customerName: task.customerName,
      noWa: task.noWa,
      complaint: task.complaint,
      status: task.status,
      checkinAt: task.checkinAt,
      doneAt: task.doneAt,
      passwordPattern: task.passwordPattern,
      imei: task.imei,
      hpCatalog: {
        modelName: task.hpCatalog.modelName,
        brand: task.hpCatalog.brand,
      },
      technician: task.technician,
      invoice: task.invoice,
      createdBy: task.createdBy,
    }));
  }, [dashboardData?.myTasks]);

  function handleOpenDetail(service: RecentService) {
    setSelectedService(service);
    setIsDetailDialogOpen(true);
  }

  function handleCloseDetail() {
    if (takingServiceId) return; // Don't close while taking
    setIsDetailDialogOpen(false);
    setSelectedService(null);
  }

  async function handleConfirmTake() {
    if (!selectedService) return;
    setTakingServiceId(selectedService.id);
    try {
      const result = await technicianTakeService(selectedService.id);
      if (result.success) {
        setIsDetailDialogOpen(false);
        setSelectedService(null);
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        setError(result.error || "Failed to take service");
      }
    } catch (err) {
      console.error("Error taking service:", err);
      setError("Failed to take service");
    } finally {
      setTakingServiceId(null);
    }
  }

  // Memoize the converted task so the ServiceTaskCard receives a stable
  // object reference and its useEffect doesn't fire on unrelated re-renders.
  const selectedTaskAsItem = useMemo<ServiceTaskItem | null>(() => {
    if (!selectedTaskService) return null;
    return {
      id: selectedTaskService.id,
      customerName: selectedTaskService.customerName,
      noWa: selectedTaskService.noWa,
      complaint: selectedTaskService.complaint,
      passwordPattern: selectedTaskService.passwordPattern,
      imei: selectedTaskService.imei,
      status: selectedTaskService.status,
      checkinAt: selectedTaskService.checkinAt,
      doneAt: selectedTaskService.doneAt,
      hpCatalog: selectedTaskService.hpCatalog,
      items: selectedTaskService.items,
      invoice: selectedTaskService.invoice,
    };
  }, [selectedTaskService]);

  function handleOpenTaskDetail(service: TechnicianTaskService) {
    setSelectedTaskService(service);
    setIsTaskSheetOpen(true);
  }

  function handleCloseTaskDetail() {
    setIsTaskSheetOpen(false);
    setSelectedTaskService(null);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <RiToolsLine className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiToolsLine className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Data Available</h2>
        <p className="text-muted-foreground mt-2">
          No tasks available at the moment.
        </p>
      </div>
    );
  }

  const { stats, availableServices, myTasks } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your repair tasks and available services
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Tasks"
          value={stats.totalAssigned}
          description="Assigned to you"
          icon={<RiToolsLine className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressCount}
          description="Currently repairing"
          icon={<RiPlayCircleLine className="h-4 w-4" />}
        />
        <StatCard
          title="Completed"
          value={stats.doneCount}
          description="Waiting for pickup"
          icon={<RiCheckLine className="h-4 w-4" />}
        />
        <StatCard
          title="Available"
          value={stats.availableCount}
          description="Unassigned services"
          icon={<RiSmartphoneLine className="h-4 w-4" />}
        />
      </div>

      {/* Available Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiToolsLine className="h-5 w-5" />
            Available Services
          </CardTitle>
          <CardDescription>
            Services waiting to be taken: {availableServices.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceTable
            services={availableServicesTableItems}
            variant="active"
            showInvoice={false}
            showTechnician={false}
            showCreatedBy={false}
            emptyMessage="No available services at the moment"
            onMoreClick={(service) => {
              // Find the original service from availableServices
              const originalService = availableServices.find(s => s.id === service.id);
              if (originalService) handleOpenDetail(originalService);
            }}
          />
        </CardContent>
      </Card>

      {/* My Current Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiSmartphoneLine className="h-5 w-5" />
            My Current Tasks
          </CardTitle>
          <CardDescription>
            Services assigned to you: {myTasks.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceTable
            services={myTasksTableItems}
            variant="active"
            showInvoice={true}
            showTechnician={false}
            showCreatedBy={false}
            emptyMessage="No tasks assigned to you"
            onRowClick={(service) => {
              // Find the original task from myTasks
              const originalTask = myTasks.find(t => t.id === service.id);
              if (originalTask) handleOpenTaskDetail(originalTask);
            }}
          />
        </CardContent>
      </Card>

      {/* Service Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDetail(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Service Detail</DialogTitle>
            <DialogDescription>
              Review the service details before taking this task.
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              {/* Customer */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiUserLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedService.customerName || "-"}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiPhoneLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{selectedService.noWa}</p>
                </div>
              </div>

              {/* Device */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiCellphoneLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="font-medium">
                    {selectedService.hpCatalog.brand.name} {selectedService.hpCatalog.modelName}
                  </p>
                </div>
              </div>

              {/* Complaint */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiChatQuoteLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Complaint</p>
                  <p className="font-medium whitespace-pre-wrap">{selectedService.complaint}</p>
                </div>
              </div>

              {/* Check-in Time */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiTimeLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Check-in Time</p>
                  <p className="font-medium">{formatDate(selectedService.checkinAt)}</p>
                </div>
              </div>

              {/* Created By */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <RiUserStarLine className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="font-medium">{selectedService.createdBy.name}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDetail}
              disabled={!!takingServiceId}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTake}
              disabled={!!takingServiceId}
            >
              {takingServiceId ? "Taking..." : "Confirm Take"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet - Bottom Sheet for My Current Tasks */}
      <Sheet open={isTaskSheetOpen} onOpenChange={(open) => { if (!open) handleCloseTaskDetail(); }}>
        <SheetContent side="bottom" className="rounded-t-4xl h-[85vh] sm:max-w-2xl mx-auto overflow-y-auto">
          <SheetHeader className="flex items-center">
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>

          {selectedTaskAsItem && (
            <div className="px-2 mb-2">
              <ServiceTaskCard
                task={selectedTaskAsItem}
                variant="active"
                onRefresh={() => fetchDashboardData(true)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
