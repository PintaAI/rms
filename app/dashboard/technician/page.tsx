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
  getTechnicianDashboardData,
  technicianTakeService,
  type TechnicianDashboardData,
} from "@/actions/dashboard";
import {
  RiSmartphoneLine,
  RiTimeLine,
  RiCheckLine,
  RiPlayCircleLine,
  RiFileList3Line,
  RiCheckboxCircleLine,
  RiToolsLine,
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

export default function TechnicianPage() {
  const [dashboardData, setDashboardData] = useState<TechnicianDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingServiceId, setTakingServiceId] = useState<string | null>(null);

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

  async function handleTakeService(serviceId: string) {
    setTakingServiceId(serviceId);
    try {
      const result = await technicianTakeService(serviceId);
      if (result.success) {
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Services"
          value={stats.availableCount}
          description="Waiting to be taken"
          icon={<RiTimeLine className="h-4 w-4" />}
        />
        <StatCard
          title="My Tasks"
          value={stats.inProgressCount}
          description="Currently in progress"
          icon={<RiPlayCircleLine className="h-4 w-4" />}
        />
        <StatCard
          title="Completed"
          value={stats.doneCount}
          description="Done or picked up"
          icon={<RiCheckLine className="h-4 w-4" />}
        />
        <StatCard
          title="Total Assigned"
          value={stats.totalAssigned}
          description="All services assigned to you"
          icon={<RiFileList3Line className="h-4 w-4" />}
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
    </div>
  );
}