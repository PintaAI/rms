"use client";

import { useEffect, useState } from "react";
import { useToko } from "@/components/toko-provider";
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
  getTokoDashboardData,
  type TokoDashboardData,
} from "@/actions/dashboard";
import {
  RiSmartphoneLine,
  RiUserLine,
  RiToolsLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiCheckLine,
  RiPlayCircleLine,
  RiFileList3Line,
  RiStore2Line,
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

// Format currency (Indonesian Rupiah)
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

export default function AdminPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const [dashboardData, setDashboardData] = useState<TokoDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!selectedToko) {
        setDashboardData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getTokoDashboardData(selectedToko.id);
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
  }, [selectedToko]);

  // Loading state
  if (tokoLoading || isLoading) {
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

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <RiFileList3Line className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  // No data
  if (!dashboardData) {
    return null;
  }

  const { toko, stats, recentServices } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{toko.name} Dashboard</h1>
        <p className="text-muted-foreground">
          {toko.address || "No address"} • {toko.phone || "No phone"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          description="All time services"
          icon={<RiSmartphoneLine className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Services"
          value={stats.pendingServices}
          description="Waiting to be processed"
          icon={<RiTimeLine className="h-4 w-4" />}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressServices}
          description="Currently being repaired"
          icon={<RiPlayCircleLine className="h-4 w-4" />}
        />
        <StatCard
          title="Completed"
          value={stats.completedServices}
          description="Done or picked up"
          icon={<RiCheckLine className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Staff & Technicians"
          value={stats.totalUsers}
          description="Active users"
          icon={<RiUserLine className="h-4 w-4" />}
        />
        <StatCard
          title="Brands"
          value={stats.totalBrands}
          description="Phone brands"
          icon={<RiSmartphoneLine className="h-4 w-4" />}
        />
        <StatCard
          title="Spareparts"
          value={stats.totalSpareparts}
          description="Available parts"
          icon={<RiToolsLine className="h-4 w-4" />}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description={`${stats.unpaidInvoices} unpaid invoices`}
          icon={<RiMoneyDollarCircleLine className="h-4 w-4" />}
        />
      </div>

      {/* Recent Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>
            Latest 10 service orders in this toko
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No services found for this toko.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.map((service) => (
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
                      <div>
                        <div className="font-medium">
                          {service.hpCatalog.brand.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {service.hpCatalog.modelName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {service.complaint}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.technician?.name || (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[service.status] || "secondary"}>
                        {statusLabels[service.status] || service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
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