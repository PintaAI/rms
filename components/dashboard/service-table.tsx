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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBrandIcon } from "@/lib/brand-icons";
import {
  RiUserStarLine,
  RiUserLine,
  RiMoreLine,
  RiMoneyDollarCircleLine,
  RiPhoneLine,
  RiCheckLine,
  RiPencilLine,
  RiDeleteBinLine,
} from "@remixicon/react";

// Status badge colors
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  received: "secondary",
  repairing: "default",
  done: "outline",
  picked_up: "default",
  failed: "destructive",
};

// Status labels
const statusLabels: Record<string, string> = {
  received: "Received",
  repairing: "In Progress",
  done: "Done",
  picked_up: "Picked Up",
  failed: "Failed",
};

// Payment status colors
const paymentStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  unpaid: "destructive",
  paid: "success",
};

// Format date
function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
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

// Unified service item interface
export interface ServiceTableItem {
  id: string;
  hpCatalogId: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  note?: string | null;
  status: string;
  checkinAt: Date;
  doneAt?: Date | null;
  checkoutAt?: Date | null;
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
  passwordPattern?: string | null;
  imei?: string | null;
}

// Variant determines which columns and actions are shown
export type ServiceTableVariant = "active" | "completed" | "history";

interface ServiceTableProps {
  services: ServiceTableItem[];
  variant?: ServiceTableVariant;

  // Column visibility
  showInvoice?: boolean;
  showCreatedBy?: boolean;
  showTechnician?: boolean;

  // Action callbacks - if not provided, the action button won't show
  onTechnicianClick?: (service: ServiceTableItem) => void;
  onMoreClick?: (service: ServiceTableItem) => void;
  onEditClick?: (service: ServiceTableItem) => void;
  onDeleteClick?: (service: ServiceTableItem) => void;
  onMarkPaidClick?: (invoiceId: string, serviceId: string) => void;
  onPickupClick?: (serviceId: string) => void;
  onCallClick?: (phone: string, service: ServiceTableItem) => void;
  onRowClick?: (service: ServiceTableItem) => void;

  // UI customization
  emptyMessage?: string;
}

export function ServiceTable({
  services,
  variant = "active",
  showInvoice = true,
  showCreatedBy = false,
  showTechnician = true,
  onTechnicianClick,
  onMoreClick,
  onEditClick,
  onDeleteClick,
  onMarkPaidClick,
  onPickupClick,
  onCallClick,
  onRowClick,
  emptyMessage = "No services found",
}: ServiceTableProps) {
  // Determine which columns to show based on variant
  const showCheckinAt = variant === "active";
  const showDoneAt = variant === "completed" || variant === "history";
  const showCheckoutAt = variant === "history";
  const showActions = variant === "completed";

  // Calculate colspan for empty row
  const getEmptyColSpan = () => {
    let colspan = 5; // Customer, Device, Complaint, Note, Status (base columns)
    if (showCreatedBy) colspan++;
    if (showTechnician) colspan++;
    if (showInvoice) colspan++;
    if (showCheckinAt) colspan++;
    if (showDoneAt) colspan++;
    if (showCheckoutAt) colspan++;
    if (showActions) colspan++;
    return colspan;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Complaint</TableHead>
          <TableHead>Note</TableHead>
          {showCreatedBy && <TableHead>Created By</TableHead>}
          <TableHead>Status</TableHead>
          {showTechnician && <TableHead>Technician</TableHead>}
          {showInvoice && <TableHead>Invoice</TableHead>}
          {showCheckinAt && <TableHead>Check-in</TableHead>}
          {showDoneAt && <TableHead>Completed At</TableHead>}
          {showCheckoutAt && <TableHead>Picked Up At</TableHead>}
          {showActions && <TableHead>Actions</TableHead>}
          {!showActions && variant !== "history" && <TableHead></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={getEmptyColSpan()}
              className="h-24 text-center"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => (
            <TableRow
              key={service.id}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(service)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <RiUserLine className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>{service.customerName || "-"}</span>
                    <span className="text-xs text-muted-foreground">{service.noWa}</span>
                  </div>
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
              <TableCell className="max-w-xs truncate">
                {service.note || "-"}
              </TableCell>
              {showCreatedBy && (
                <TableCell>
                  {service.createdBy?.name ? (
                    <Badge variant="default">
                      <RiUserStarLine className="h-3 w-3 mr-1" />
                      {service.createdBy.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <RiUserLine className="h-3 w-3 mr-1" />
                      Unknown
                    </Badge>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge variant={statusColors[service.status] || "outline"}>
                  {statusLabels[service.status] || service.status}
                </Badge>
              </TableCell>
              {showTechnician && (
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
              )}
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
                          {service.invoice.paymentStatus === "paid" ? (
                            <RiCheckLine className="h-3 w-3 mr-1" />
                          ) : null}
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
              {showCheckinAt && (
                <TableCell className="text-muted-foreground">
                  {formatDate(service.checkinAt)}
                </TableCell>
              )}
              {showDoneAt && (
                <TableCell className="text-muted-foreground">
                  {formatDate(service.doneAt)}
                </TableCell>
              )}
              {showCheckoutAt && (
                <TableCell className="text-muted-foreground">
                  {formatDate(service.checkoutAt)}
                </TableCell>
              )}
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    {onCallClick && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCallClick(service.noWa, service)}
                      >
                        <RiPhoneLine className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    )}
                    {onPickupClick && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onPickupClick(service.id)}
                      >
                        <RiCheckLine className="h-4 w-4 mr-1" />
                        Picked Up
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
              {!showActions && variant !== "history" && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      render={
                        <Button variant="ghost" size="icon">
                          <RiMoreLine className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent>
                      {onEditClick && (
                        <DropdownMenuItem onClick={() => onEditClick(service)}>
                          <RiPencilLine className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDeleteClick && service.invoice?.paymentStatus !== "paid" && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteClick(service)}
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
