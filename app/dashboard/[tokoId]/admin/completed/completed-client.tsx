"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  ServiceTable,
  type ServiceTableItem,
} from "@/components/dashboard/service-table";
import {
  getCompletedServices,
  getPickedUpServices,
  pickupService,
  payInvoice,
} from "@/actions";
import { RiRefreshLine, RiHistoryLine } from "@remixicon/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type { ServiceTableItem } from "@/components/dashboard/service-table/types";

interface AdminCompletedClientProps {
  tokoId: string;
  initialServices: ServiceTableItem[];
  initialHistory: ServiceTableItem[];
}

export function AdminCompletedClient({
  tokoId,
  initialServices,
  initialHistory,
}: AdminCompletedClientProps) {
  const [services, setServices] = useState<ServiceTableItem[]>(initialServices);
  const [historyServices, setHistoryServices] = useState<ServiceTableItem[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ready" | "history">("ready");

  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCompletedServices(tokoId);
      if (result.success && result.data) {
        setServices(result.data as ServiceTableItem[]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tokoId]);

  const fetchHistoryData = useCallback(async () => {
    try {
      const result = await getPickedUpServices(tokoId);
      if (result.success && result.data) {
        setHistoryServices(result.data as ServiceTableItem[]);
      }
    } catch (err) {
      console.error("Error fetching history data:", err);
    }
  }, [tokoId]);

  const handleCallClick = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const formattedPhone = cleaned.startsWith("0")
      ? "62" + cleaned.slice(1)
      : cleaned.startsWith("62")
        ? cleaned
        : cleaned;
    window.open(`https://wa.me/${formattedPhone}`, "_blank");
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
      const result = await pickupService(selectedServiceId);
      if (result.success) {
        fetchData();
        fetchHistoryData();
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
      const result = await payInvoice(selectedInvoiceId);
      if (result.success) {
        fetchData();
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Completed Services</h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={activeTab === "ready" ? fetchData : fetchHistoryData}
          disabled={isLoading}
        >
          <RiRefreshLine className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ready" | "history")}>
        <TabsList>
          <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
          <TabsTrigger value="history">
            <RiHistoryLine className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ready for Pickup</CardTitle>
              <CardDescription>
                Services with status &quot;Done&quot; awaiting customer pickup ({services.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceTable
                services={services}
                preset="completed"
                onMarkPaid={handleMarkPaidClick}
                onCall={handleCallClick}
                onPickup={handlePickupClick}
                emptyMessage="No completed or failed services awaiting pickup"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Picked Up History</CardTitle>
              <CardDescription>
                Services that have been picked up by customers ({historyServices.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceTable
                services={historyServices}
                preset="history"
                emptyMessage="No picked up services in history"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}