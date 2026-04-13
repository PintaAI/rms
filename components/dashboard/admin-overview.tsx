"use client";

import { useEffect, useState } from "react";
import { useToko } from "@/components/toko/toko-provider";
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
  type RecentService,
} from "@/actions/dashboard";
import { TechnicianAssignmentDialog } from "@/components/admin/technician-assignment-dialog";
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
  RiUserStarLine,
} from "@remixicon/react";
import {
  SiApple,
  SiSamsung,
  SiXiaomi,
  SiOppo,
  SiVivo,
  SiHuawei,
  SiOneplus,
  SiGoogle,
  SiSony,
  SiNokia,
  SiMotorola,
  SiAsus,
  SiLenovo,
  SiLg,
  SiHonor,
} from "react-icons/si";
import { FaAndroid, FaMobileAlt } from "react-icons/fa";
import { MdSmartphone } from "react-icons/md";

// Brand icon mapping - maps brand names to their corresponding icons
const brandIconMap: Record<string, React.ReactNode> = {
  apple: <SiApple className="h-4 w-4" />,
  iphone: <SiApple className="h-4 w-4" />,
  samsung: <SiSamsung className="h-4 w-4" />,
  xiaomi: <SiXiaomi className="h-4 w-4" />,
  oppo: <SiOppo className="h-4 w-4" />,
  vivo: <SiVivo className="h-4 w-4" />,
  realme: <FaMobileAlt className="h-4 w-4" />,
  huawei: <SiHuawei className="h-4 w-4" />,
  oneplus: <SiOneplus className="h-4 w-4" />,
  google: <SiGoogle className="h-4 w-4" />,
  sony: <SiSony className="h-4 w-4" />,
  nokia: <SiNokia className="h-4 w-4" />,
  motorola: <SiMotorola className="h-4 w-4" />,
  asus: <SiAsus className="h-4 w-4" />,
  lenovo: <SiLenovo className="h-4 w-4" />,
  lg: <SiLg className="h-4 w-4" />,
  honor: <SiHonor className="h-4 w-4" />,
  zte: <FaMobileAlt className="h-4 w-4" />,
  infinix: <FaMobileAlt className="h-4 w-4" />,
  tecno: <FaMobileAlt className="h-4 w-4" />,
  itel: <FaMobileAlt className="h-4 w-4" />,
};

// Function to get brand icon
function getBrandIcon(brandName: string): React.ReactNode {
  const normalizedName = brandName.toLowerCase().trim();
  return brandIconMap[normalizedName] || <MdSmartphone className="h-4 w-4" />;
}

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

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminOverview() {
  const { selectedToko, tokoList } = useToko();
  const [dashboardData, setDashboardData] = useState<TokoDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<RecentService | null>(
    null
  );
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const fetchDashboardData = async () => {
    if (!selectedToko?.id) {
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
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedToko?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
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
            Welcome back! Here's what's happening today.
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
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>No data available. Select a toko to view dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, recentServices } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening at {dashboardData.toko.name}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <RiSmartphoneLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              All time services
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RiPlayCircleLine className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressServices}</div>
            <p className="text-xs text-muted-foreground">
              Currently being repaired
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <RiCheckLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedServices}</div>
            <p className="text-xs text-muted-foreground">
              Services completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <RiTimeLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingServices}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to be processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <RiUserLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Staff & technicians
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spareparts</CardTitle>
            <RiToolsLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpareparts}</div>
            <p className="text-xs text-muted-foreground">
              Available items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Services */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
          <CardDescription>
            Latest service orders at this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentServices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent services
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.slice(0, 5).map((service) => (
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
                        {getBrandIcon(service.hpCatalog.brand.name)}
                        <span>{service.hpCatalog.modelName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {service.complaint}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[service.status] || "default"}>
                        {statusLabels[service.status] || service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.technician ? (
                        <div className="flex items-center gap-1">
                          <RiUserStarLine className="h-3 w-3" />
                          <span>{service.technician.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(service.checkinAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!service.technician && service.status === "received" && (
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setIsAssignDialogOpen(true);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Assign
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Technician Assignment Dialog */}
      {selectedService && selectedToko?.id && (
        <TechnicianAssignmentDialog
          serviceId={selectedService.id}
          tokoId={selectedToko.id}
          open={isAssignDialogOpen}
          onOpenChange={(open) => {
            setIsAssignDialogOpen(open);
            if (!open) setSelectedService(null);
          }}
          onAssignmentChange={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}