"use client";

import { useEffect, useState, useCallback } from "react";
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
  getStaffDashboardData,
  type StaffDashboardData,
} from "@/actions/dashboard";
import { AddServiceForm } from "@/components/staff/add-service-form";
import { RiAddLine, RiMoreLine, RiRefreshLine } from "@remixicon/react";

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

// Payment status colors
const paymentStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  unpaid: "destructive",
  paid: "default",
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

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StaffServicesPage() {
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getStaffDashboardData();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            <div className="text-center text-muted-foreground">Loading recent transactions...</div>
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

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  const { recentServices } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Recent service transactions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <RiAddLine className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </div>

      {/* Add Service Dialog */}
      <AddServiceForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest {recentServices.length} service requests
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
          {recentServices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No recent transactions found
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead></TableHead>
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
                    <TableCell>
                      {service.invoice ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {formatCurrency(service.invoice.grandTotal)}
                          </span>
                          <Badge
                            variant={paymentStatusColors[service.invoice.paymentStatus] || "outline"}
                            className="w-fit mt-1"
                          >
                            {service.invoice.paymentStatus}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(service.checkinAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
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
