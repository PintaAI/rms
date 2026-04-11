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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  getStaffDashboardData,
  type StaffDashboardData,
} from "@/actions/dashboard";
import {
  RiSmartphoneLine,
  RiTimeLine,
  RiCheckLine,
  RiPlayCircleLine,
  RiFileList3Line,
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

export default function StaffPage() {
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getStaffDashboardData();
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

    fetchDashboardData();
  }, []);

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

  const { stats, todayServices, recentServices } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your service activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          icon={<RiFileList3Line className="h-4 w-4" />}
        />
        <StatCard
          title="Received"
          value={stats.receivedCount}
          description="Waiting to be processed"
          icon={<RiTimeLine className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={stats.repairingCount}
          description="Currently being repaired"
          icon={<RiPlayCircleLine className="h-4 w-4" />}
        />
        <StatCard
          title="Done"
          value={stats.doneCount}
          description="Ready for pickup"
          icon={<RiCheckLine className="h-4 w-4" />}
        />
        <StatCard
          title="Picked Up"
          value={stats.pickedUpCount}
          description="Completed"
          icon={<RiCheckboxCircleLine className="h-4 w-4" />}
        />
      </div>

      {/* Today's Services */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Services</CardTitle>
          <CardDescription>
            Services received today: {todayServices.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayServices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No services received today
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
                {todayServices.map((service) => (
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

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>Latest service requests</CardDescription>
        </CardHeader>
        <CardContent>
          {recentServices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No services yet
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
                  <TableHead>Technician</TableHead>
                  <TableHead>Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.map((service) => (
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
                    <TableCell>
                      {service.technician?.name || "-"}
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