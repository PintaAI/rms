"use client";

import { useEffect, useState, useCallback } from "react";
import { useToko } from "@/components/toko/toko-provider";
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
  type ServiceListItem,
} from "@/actions";
import { RiRefreshLine, RiHistoryLine, RiStore2Line } from "@remixicon/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCompletedPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [historyServices, setHistoryServices] = useState<ServiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ready" | "history">("ready");

  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedToko) {
      setError("No toko selected");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCompletedServices(selectedToko.id);
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        setError(result.error || "Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedToko]);

  const fetchHistoryData = useCallback(async () => {
    if (!selectedToko) {
      setError("No toko selected");
      return;
    }

    try {
      const result = await getPickedUpServices(selectedToko.id);
      if (result.success && result.data) {
        setHistoryServices(result.data);
      } else {
        setError(result.error || "Failed to load history data");
      }
    } catch (err) {
      console.error("Error fetching history data:", err);
      setError("Failed to load history data");
    }
  }, [selectedToko]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryData();
    }
  }, [activeTab, fetchHistoryData]);

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

  if (isLoading || tokoLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold">
          {tokoLoading ? "Loading toko data..." : "Loading completed services..."}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {tokoLoading ? "Fetching your store information" : "Fetching completed service list"}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!selectedToko) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiStore2Line className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Toko Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please select a toko from the sidebar to view completed services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Completed Services</h1>
          <p className="text-muted-foreground">
            Track completed and picked up services at {selectedToko.name}
          </p>
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
                services={services as ServiceTableItem[]}
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
                services={historyServices as ServiceTableItem[]}
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