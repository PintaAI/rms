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
import { CompletedServiceTable } from "@/components/staff/completed-service-table";
import {
  getCompletedServices,
  getPickedUpServices,
  type ServiceListItem,
} from "@/actions/dashboard";
import { RiRefreshLine, RiHistoryLine } from "@remixicon/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffCompletedPage() {
  const { selectedToko } = useToko();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [historyServices, setHistoryServices] = useState<ServiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ready" | "history">("ready");

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
            <div className="text-center text-muted-foreground">Loading completed services...</div>
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

  if (!selectedToko) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-muted-foreground">Select a toko to view completed services</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Completed Services</h1>
          <p className="text-muted-foreground">
            Track completed and picked up services
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ready" | "history")}>
        <TabsList>
          <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
          <TabsTrigger value="history">
            <RiHistoryLine className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Ready for Pickup Tab */}
        <TabsContent value="ready" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ready for Pickup</CardTitle>
              <CardDescription>
                Services with status "Done" awaiting customer pickup ({services.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletedServiceTable
                services={services}
                onRefresh={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Picked Up History</CardTitle>
              <CardDescription>
                Services that have been picked up by customers ({historyServices.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletedServiceTable
                services={historyServices}
                onRefresh={fetchHistoryData}
                isHistory={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
