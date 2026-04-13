"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FaMobileAlt } from "react-icons/fa";
import { MdSmartphone } from "react-icons/md";
import { RiUserStarLine, RiUserLine, RiMoreLine, RiMoneyDollarCircleLine } from "@remixicon/react";

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

// Base service item interface
export interface ServiceTableItem {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  status: string;
  checkinAt: Date;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  technician: {
    id?: string;
    name: string;
  } | null;
  invoice?: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  createdBy?: {
    name: string;
  };
}

interface ServiceTableProps {
  services: ServiceTableItem[];
  showInvoice?: boolean;
  showCreatedBy?: boolean;
  onTechnicianClick?: (service: ServiceTableItem) => void;
  onMoreClick?: (service: ServiceTableItem) => void;
  emptyMessage?: string;
}

interface ExtendedServiceTableProps extends ServiceTableProps {
  onMarkPaidClick?: (invoiceId: string, serviceId: string) => void;
}

export function ServiceTable({
  services,
  showInvoice = true,
  showCreatedBy = false,
  onTechnicianClick,
  onMoreClick,
  onMarkPaidClick,
  emptyMessage = "No services found",
}: ExtendedServiceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Complaint</TableHead>
          {showCreatedBy && <TableHead>Created By</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Technician</TableHead>
          {showInvoice && <TableHead>Invoice</TableHead>}
          <TableHead>Check-in</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showCreatedBy ? 9 : showInvoice ? 8 : 7}
              className="h-24 text-center"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{service.customerName || "-"}</span>
                  <span className="text-xs text-muted-foreground">{service.noWa}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {getBrandIcon(service.hpCatalog.brand.name)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {service.hpCatalog.brand.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.hpCatalog.modelName}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {service.complaint}
              </TableCell>
              {showCreatedBy && (
                <TableCell>
                  {service.createdBy?.name || "-"}
                </TableCell>
              )}
              <TableCell>
                <Badge variant={statusColors[service.status] || "outline"}>
                  {statusLabels[service.status] || service.status}
                </Badge>
              </TableCell>
              <TableCell>
                {service.technician ? (
                  onTechnicianClick ? (
                    <button
                      onClick={() => onTechnicianClick(service)}
                      className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    >
                      <Badge variant="default" className="cursor-pointer">
                        <RiUserStarLine className="h-3 w-3 mr-1" />
                        {service.technician.name}
                      </Badge>
                    </button>
                  ) : (
                    <Badge variant="default">
                      <RiUserStarLine className="h-3 w-3 mr-1" />
                      {service.technician.name}
                    </Badge>
                  )
                ) : onTechnicianClick ? (
                  <button
                    onClick={() => onTechnicianClick(service)}
                    className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  >
                    <Badge variant="secondary" className="cursor-pointer">
                      <RiUserLine className="h-3 w-3 mr-1" />
                      Unassigned
                    </Badge>
                  </button>
                ) : (
                  <Badge variant="secondary">
                    <RiUserLine className="h-3 w-3 mr-1" />
                    Unassigned
                  </Badge>
                )}
              </TableCell>
              {showInvoice && (
                <TableCell>
                  {service.invoice ? (
                    <div className="flex flex-col gap-2">
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
                      {service.invoice.paymentStatus === "unpaid" && onMarkPaidClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkPaidClick(service.invoice!.id, service.id)}
                        >
                          <RiMoneyDollarCircleLine className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {formatDate(service.checkinAt)}
              </TableCell>
              <TableCell>
                {onMoreClick ? (
                  <Button variant="ghost" size="icon" onClick={() => onMoreClick(service)}>
                    <RiMoreLine className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon">
                    <RiMoreLine className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
