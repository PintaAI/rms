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
  type TechnicianTaskService,
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
  RiPlayCircleLine,
  RiCheckLine,
  RiCheckboxCircleLine,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your tasks for today.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted/50" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted/50" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your tasks for today.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your tasks for today.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>No data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, availableServices, myTasks } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your tasks for today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <RiToolsLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RiPlayCircleLine className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently repairing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <RiCheckLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.doneCount}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for pickup
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <RiSmartphoneLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableCount}</div>
            <p className="text-xs text-muted-foreground">
              Unassigned services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>
            Services assigned to you that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {taskItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tasks assigned to you
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {taskItems.slice(0, 6).map((task) => (
                <ServiceTaskCard
                  key={task.id}
                  task={task}
                  variant="active"
                  onRefresh={() => fetchDashboardData(true)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Services Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          <CardDescription>
            Services waiting to be assigned - click "Take" to claim them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableServices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No available services
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableServices.slice(0, 10).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {service.customerName || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {service.noWa}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RiSmartphoneLine className="h-4 w-4" />
                        <span>{service.hpCatalog.modelName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {service.complaint}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(service.checkinAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleTakeService(service.id)}
                        disabled={takingServiceId === service.id}
                      >
                        {takingServiceId === service.id ? "Taking..." : "Take"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service Detail Dialog */}
      {selectedService && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>
                Information about this service
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-base">{selectedService.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{selectedService.noWa}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Device</p>
                  <p className="text-base">
                    {selectedService.hpCatalog.brand.name} {selectedService.hpCatalog.modelName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={statusColors[selectedService.status] || "default"}>
                    {statusLabels[selectedService.status] || selectedService.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complaint</p>
                <p className="text-base">{selectedService.complaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Check-in</p>
                  <p className="text-base">{formatDate(selectedService.checkinAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-base">{selectedService.createdBy.name}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Task Detail Sheet */}
      {selectedTaskService && (
        <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                {selectedTaskService.hpCatalog.brand.name} {selectedTaskService.hpCatalog.modelName}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-base">{selectedTaskService.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{selectedTaskService.noWa}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Complaint</p>
                <p className="text-base">{selectedTaskService.complaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={statusColors[selectedTaskService.status] || "default"}>
                    {statusLabels[selectedTaskService.status] || selectedTaskService.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Check-in</p>
                  <p className="text-base">{formatDate(selectedTaskService.checkinAt)}</p>
                </div>
              </div>
              {selectedTaskService.passwordPattern && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Password Pattern</p>
                  <p className="text-base">{selectedTaskService.passwordPattern}</p>
                </div>
              )}
              {selectedTaskService.imei && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IMEI</p>
                  <p className="text-base">{selectedTaskService.imei}</p>
                </div>
              )}
              {selectedTaskService.items && selectedTaskService.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedTaskService.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.qty} x {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}