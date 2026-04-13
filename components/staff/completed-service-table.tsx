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
import { RiUserStarLine, RiUserLine, RiPhoneLine, RiCheckLine, RiMoneyDollarCircleLine } from "@remixicon/react";
import { useState } from "react";
import { markServiceAsPickedUp, markInvoiceAsPaid } from "@/actions/dashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Brand icon mapping
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

// Format phone number for WhatsApp
function formatPhoneNumber(phone: string): string {
  // Remove any non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // If starts with 0, replace with 62 (Indonesia country code)
  if (cleaned.startsWith("0")) {
    return "62" + cleaned.slice(1);
  }
  // If starts with 62, keep as is
  if (cleaned.startsWith("62")) {
    return cleaned;
  }
  // Otherwise, assume it's already in correct format
  return cleaned;
}

export interface ServiceTableItem {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  status: string;
  checkinAt: Date;
  doneAt: Date | null;
  checkoutAt: Date | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  technician: {
    name: string;
  } | null;
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  createdBy?: {
    name: string;
  };
}

interface CompletedServiceTableProps {
  services: ServiceTableItem[];
  onRefresh?: () => void;
  isHistory?: boolean;
}

export function CompletedServiceTable({
  services,
  onRefresh,
  isHistory = false,
}: CompletedServiceTableProps) {
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCallCustomer = (phone: string) => {
    // Open WhatsApp with the phone number
    const formattedPhone = formatPhoneNumber(phone);
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePickupClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsPickupDialogOpen(true);
  };

  const handleMarkPaidClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setIsPaidDialogOpen(true);
  };

  const handleConfirmPickup = async () => {
    if (!selectedServiceId) return;

    setIsProcessing(true);
    try {
      const result = await markServiceAsPickedUp(selectedServiceId);
      if (result.success) {
        onRefresh?.();
        setIsPickupDialogOpen(false);
        setSelectedServiceId(null);
      } else {
        alert(result.error || "Failed to mark as picked up");
      }
    } catch (error) {
      console.error("Error marking service as picked up:", error);
      alert("Failed to mark service as picked up");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!selectedInvoiceId) return;

    setIsProcessing(true);
    try {
      const result = await markInvoiceAsPaid(selectedInvoiceId);
      if (result.success) {
        onRefresh?.();
        setIsPaidDialogOpen(false);
        setSelectedInvoiceId(null);
      } else {
        alert(result.error || "Failed to mark invoice as paid");
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      alert("Failed to mark invoice as paid");
    } finally {
      setIsProcessing(false);
    }
  };

  // For history view, hide action buttons
  if (isHistory) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Complaint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead>Picked Up At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No picked up services in history
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
                <TableCell>
                  <Badge variant={statusColors[service.status] || "outline"}>
                    {statusLabels[service.status] || service.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {service.technician ? (
                    <Badge variant="default">
                      <RiUserStarLine className="h-3 w-3 mr-1" />
                      {service.technician.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <RiUserLine className="h-3 w-3 mr-1" />
                      Unassigned
                    </Badge>
                  )}
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
                  {service.doneAt ? formatDate(service.doneAt) : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {service.checkoutAt ? formatDate(service.checkoutAt) : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Complaint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center"
              >
                No completed services awaiting pickup
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
                <TableCell>
                  <Badge variant={statusColors[service.status] || "outline"}>
                    {statusLabels[service.status] || service.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {service.technician ? (
                    <Badge variant="default">
                      <RiUserStarLine className="h-3 w-3 mr-1" />
                      {service.technician.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <RiUserLine className="h-3 w-3 mr-1" />
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
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
                      {service.invoice.paymentStatus === "unpaid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaidClick(service.invoice!.id)}
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
                <TableCell className="text-muted-foreground">
                  {service.doneAt ? formatDate(service.doneAt) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCallCustomer(service.noWa)}
                    >
                      <RiPhoneLine className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePickupClick(service.id)}
                    >
                      <RiCheckLine className="h-4 w-4 mr-1" />
                      Picked Up
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Mark as Paid Dialog */}
      <AlertDialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this invoice as paid? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPaid} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pickup Confirmation Dialog */}
      <AlertDialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Pickup</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this service as picked up by the customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPickup} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
