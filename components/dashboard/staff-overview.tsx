"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToko } from "@/components/toko/toko-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ServiceTable, type ServiceTableItem } from "@/components/dashboard/service-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { ServiceListItem, PaginatedResult } from "@/actions/staff";
import { deleteService } from "@/actions/staff";
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
  RiAddCircleLine,
  RiFileList3Line,
  RiTimeLine,
  RiCheckLine,
  RiPlayCircleLine,
  RiCheckboxCircleLine,
  RiStore2Line,
  RiFileList3Line as RiFileList3LineIcon,
  RiArrowRightLine,
} from "@remixicon/react";
import Link from "next/link";

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

// Quick Action Card Component
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
  onClick?: () => void;
}

function QuickActionCard({ title, description, icon, href, color = "bg-primary", onClick }: QuickActionCardProps) {
  const content = (
    <div className="flex items-start gap-4">
      <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <RiArrowRightLine className="h-5 w-5 text-muted-foreground mt-1" />
    </div>
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent>
        {onClick ? (
          <div onClick={onClick}>{content}</div>
        ) : (
          <Link href={href}>{content}</Link>
        )}
      </CardContent>
    </Card>
  );
}

// Alert Card Component
interface Alert {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
}

function AlertCard({ alert }: { alert: Alert }) {
  const colors = {
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    success: "bg-green-500/10 text-green-700 dark:text-green-400",
  };

  const icons = {
    warning: "⚠",
    info: "ℹ",
    success: "✓",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${colors[alert.type]}`}>
      <span>{icons[alert.type]}</span>
      <span>{alert.message}</span>
    </span>
  );
}

interface StaffOverviewProps {
  initialServices: ServiceListItem[];
  timeFilter: "daily" | "weekly" | "monthly";
  pagination: PaginatedResult<ServiceListItem>;
}

export function StaffOverview({
  initialServices,
  timeFilter: initialTimeFilter,
  pagination,
}: StaffOverviewProps) {
  const { selectedToko } = useToko();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTableItem | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly" | "monthly">(
    initialTimeFilter
  );

  // Handle time filter change - updates URL and triggers server refetch
  const handleTimeFilterChange = (newFilter: "daily" | "weekly" | "monthly") => {
    startTransition(() => {
      setTimeFilter(newFilter);
      const params = new URLSearchParams(searchParams.toString());
      params.set("filter", newFilter);
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  // Refresh page after service creation/update
  const handleServiceCreated = useCallback(() => {
    setEditingService(null);
    router.refresh();
  }, [router]);

  // Handle delete service
  const handleDeleteService = useCallback(async () => {
    if (!deletingService) return;
    
    setIsDeleting(true);
    const result = await deleteService(deletingService.id);
    setIsDeleting(false);
    
    if (result.success) {
      setDeletingService(null);
      router.refresh();
    } else {
      // Could add toast notification here for error
      console.error("Failed to delete service:", result.error);
    }
  }, [deletingService, router]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      params.set("filter", timeFilter);
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  // Data is fetched server-side and passed as props
  const filteredServices = initialServices;

  // Calculate stats based on filtered services
  const stats = {
    total: filteredServices.length,
    received: filteredServices.filter((s) => s.status === "received").length,
    repairing: filteredServices.filter((s) => s.status === "repairing").length,
    done: filteredServices.filter((s) => s.status === "done").length,
    pickedUp: filteredServices.filter((s) => s.status === "picked_up").length,
  };


  // Generate alerts based on current data
  const alerts: Alert[] = [];
  if (stats.received > 0) {
    alerts.push({
      type: "info",
      title: "Services Awaiting Processing",
      message: `${stats.received} service(s) are waiting to be processed`,
    });
  }
  if (stats.done > 0) {
    alerts.push({
      type: "success",
      title: "Ready for Pickup",
      message: `${stats.done} service(s) are ready for customer pickup`,
    });
  }
  if (stats.total === 0) {
    alerts.push({
      type: "info",
      title: "No Services Yet",
      message: "Click 'New Service' to add your first service request",
    });
  }

  // No toko selected
  if (!selectedToko) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiStore2Line className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Toko Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please select a toko from the sidebar to view the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your service activities at {selectedToko.name}
          </p>
        </div>
        <Tabs
          value={timeFilter}
          onValueChange={(value) =>
            handleTimeFilterChange(value as "daily" | "weekly" | "monthly")
          }
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Services"
          value={stats.total}
          description="All services"
          icon={<RiFileList3Line className="h-4 w-4" />}
        />
        <StatCard
          title="Received"
          value={stats.received}
          description="Waiting to be processed"
          icon={<RiTimeLine className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={stats.repairing}
          description="Currently being repaired"
          icon={<RiPlayCircleLine className="h-4 w-4" />}
        />
        <StatCard
          title="Done"
          value={stats.done}
          description="Completed services"
          icon={<RiCheckLine className="h-4 w-4" />}
        />
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowAddService(true)}>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                  <RiAddCircleLine className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">New Service</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add a new service request</p>
                </div>
                <RiArrowRightLine className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
            </CardContent>
          </Card>
          <QuickActionCard
            title="Manage Services"
            description="View and manage active services"
            icon={<RiFileList3Line className="h-6 w-6" />}
            href="/dashboard/staff/services"
            color="bg-green-500"
          />
          <QuickActionCard
            title="Completed Services"
            description="Handle pickups and payments"
            icon={<RiCheckboxCircleLine className="h-6 w-6" />}
            href="/dashboard/staff/completed"
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Add/Edit Service Dialog */}
      <ServicesForm
        open={showAddService}
        onOpenChange={(open) => {
          setShowAddService(open);
          if (!open) {
            setEditingService(null);
          }
        }}
        onSuccess={handleServiceCreated}
        editData={editingService}
      />

      {/* Recent Services with Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Services</CardTitle>
            <CardDescription>
              {`Showing ${filteredServices.length} of ${pagination.total} services from the ${timeFilter === "daily" ? "past day" : timeFilter === "weekly" ? "past week" : "past month"}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length > 0 && (
              <div className="flex items-center gap-2">
                {alerts.map((alert, index) => (
                  <AlertCard key={index} alert={alert} />
                ))}
              </div>
            )}
            {isPending && (
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ServiceTable
            services={filteredServices}
            variant="active"
            showInvoice={true}
            showCreatedBy={true}
            emptyMessage="No services found"
            onEditClick={(service) => {
              setEditingService(service);
              setShowAddService(true);
            }}
            onDeleteClick={(service) => {
              setDeletingService(service);
            }}
          />
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page > 1) {
                        handlePageChange(pagination.page - 1);
                      }
                    }}
                    className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first, last, and pages around current page
                  const showPage =
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1);
                  
                  if (!showPage) {
                    // Show ellipsis instead of skipping pages
                    return null;
                  }
                  
                  // Show ellipsis before current page group
                  if (pageNum === pagination.page - 2 && pageNum > 2) {
                    return (
                      <PaginationItem key={`ellipsis-before-${pageNum}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis after current page group
                  if (pageNum === pagination.page + 2 && pageNum < pagination.totalPages - 1) {
                    return (
                      <PaginationItem key={`ellipsis-after-${pageNum}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={pagination.page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.page < pagination.totalPages) {
                        handlePageChange(pagination.page + 1);
                      }
                    }}
                    className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
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
    </div>
  );
}
