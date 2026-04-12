"use client";

import { useEffect, useState } from "react";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
} from "@/actions/dashboard";
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
} from "@remixicon/react";

// Status badge colors
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  received: "secondary",
  repairing: "default",
  done: "outline",
  picked_up: "default",
};

// Status labels
const statusLabels: Record<string, string> = {
  received: "Received",
  repairing: "In Progress",
  done: "Done",
  picked_up: "Picked Up",
};

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

export default function TechnicianPage() {
  const [dashboardData, setDashboardData] = useState<TechnicianDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingServiceId, setTakingServiceId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<RecentService | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTaskService, setSelectedTaskService] = useState<RecentService | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);

  async function fetchDashboardData() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTechnicianDashboardData();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setError(result.error || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // Convert RecentService to ServiceTaskItem for ServiceTaskCard
  function convertToServiceTaskItem(service: RecentService): ServiceTaskItem {
    return {
      id: service.id,
      customerName: service.customerName,
      noWa: service.noWa,
      complaint: service.complaint,
      passwordPattern: null,
      imei: null,
      status: service.status,
      checkinAt: service.checkinAt,
      doneAt: null,
      hpCatalog: service.hpCatalog,
      items: [],
      invoice: service.invoice,
    };
  }

  function handleOpenTaskDetail(service: RecentService) {
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

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  const { availableServices, myTasks } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Technician Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your repair tasks and available services
        </p>
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
          {availableServices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No available services at the moment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.customerName || "-"}
                    </TableCell>
                    <TableCell>{service.noWa}</TableCell>
                    <TableCell>
                      {service.hpCatalog.brand.name} {service.hpCatalog.modelName}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.complaint}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(service.checkinAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDetail(service)}
                      >
                        Take
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
          {myTasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No tasks assigned to you
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTasks.map((service) => (
                  <TableRow
                    key={service.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenTaskDetail(service)}
                  >
                    <TableCell className="font-medium">
                      {service.customerName || "-"}
                    </TableCell>
                    <TableCell>{service.noWa}</TableCell>
                    <TableCell>
                      {service.hpCatalog.brand.name} {service.hpCatalog.modelName}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {service.complaint}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[service.status] || "outline"}>
                        {statusLabels[service.status] || service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(service.checkinAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
        <SheetContent side="bottom" className=" rounded-t-2xl h-[85vh] sm:max-w-2xl mx-auto overflow-y-auto">
          <SheetHeader className="flex items-center">
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>

          {selectedTaskService && (
            <div >
              <ServiceTaskCard
                task={convertToServiceTaskItem(selectedTaskService)}
                variant="active"
                onRefresh={fetchDashboardData}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}