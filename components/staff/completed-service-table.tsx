"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { ServiceTable, type ServiceTableItem } from "@/components/dashboard/service-table";
import { markServiceAsPickedUp, markInvoiceAsPaid } from "@/actions/staff";

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

  const handleCallClick = (phone: string) => {
    // Format phone number for WhatsApp
    const cleaned = phone.replace(/\D/g, "");
    const formattedPhone = cleaned.startsWith("0")
      ? "62" + cleaned.slice(1)
      : cleaned.startsWith("62")
        ? cleaned
        : cleaned;
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

  return (
    <>
      <ServiceTable
        services={services}
        variant={isHistory ? "history" : "completed"}
        showInvoice={true}
        showTechnician={true}
        onMarkPaidClick={handleMarkPaidClick}
        onCallClick={handleCallClick}
        onPickupClick={handlePickupClick}
        emptyMessage={
          isHistory
            ? "No picked up services in history"
            : "No completed services awaiting pickup"
        }
      />

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
