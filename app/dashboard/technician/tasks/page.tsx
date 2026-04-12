"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getTechnicianTasks,
  updateServiceStatus,
  removeServiceItem,
  getTechnicianSpareparts,
  getTechnicianServicePricelists,
  type TechnicianTaskItem,
} from "@/actions/dashboard";
import { ServiceTaskCard } from "@/components/technician/service-task-card";
import { AddRepairItemForm } from "@/components/technician/add-repair-item-form";

export default function TechnicianTasksPage() {
  const [tasks, setTasks] = useState<TechnicianTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string; defaultPrice: number }>>([]);
  const [servicePricelists, setServicePricelists] = useState<Array<{ id: string; title: string; defaultPrice: number }>>([]);

  // Status dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTaskId, setStatusTaskId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function fetchTasks() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTechnicianTasks();
      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        setError(result.error || "Failed to load tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSparepartsAndPricelists() {
    try {
      const [sparepartsResult, pricelistsResult] = await Promise.all([
        getTechnicianSpareparts(),
        getTechnicianServicePricelists(),
      ]);

      if (sparepartsResult.success && sparepartsResult.data) {
        setSpareparts(sparepartsResult.data);
      }
      if (pricelistsResult.success && pricelistsResult.data) {
        setServicePricelists(pricelistsResult.data);
      }
    } catch (err) {
      console.error("Error fetching spareparts/pricelists:", err);
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchSparepartsAndPricelists();
  }, []);

  function openItemDialog(task: TechnicianTaskItem) {
    setSelectedTaskId(task.id);
    setItemDialogOpen(true);
  }

  async function handleRemoveItem(itemId: string) {
    setError(null);

    try {
      const result = await removeServiceItem(itemId);
      if (result.success) {
        await fetchTasks();
      } else {
        setError(result.error || "Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Failed to remove item");
    }
  }

  function openStatusDialog(taskId: string, currentStatus: string) {
    setStatusTaskId(taskId);
    setNewStatus(currentStatus);
    setStatusDialogOpen(true);
  }

  async function handleUpdateStatus() {
    if (!statusTaskId || !newStatus) return;

    setIsUpdatingStatus(true);
    setError(null);

    try {
      const result = await updateServiceStatus(statusTaskId, newStatus as any);
      if (result.success) {
        setStatusDialogOpen(false);
        await fetchTasks();
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Separate tasks by status
  const activeTasks = tasks.filter((t) => t.status === "received" || t.status === "repairing");
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "picked_up");

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading tasks...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tasks / Servisan</h1>
        <p className="text-muted-foreground">
          Manage your assigned services, update status, and add repair items
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tasks Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No active tasks. Take available services from the dashboard.
                </div>
              </CardContent>
            </Card>
          ) : (
            activeTasks.map((task) => (
              <ServiceTaskCard
                key={task.id}
                task={task}
                variant="active"
                onUpdateStatus={(taskId, currentStatus) => openStatusDialog(taskId, currentStatus)}
                onAddItem={(t) => openItemDialog(t)}
                onRemoveItem={(itemId) => handleRemoveItem(itemId)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No completed tasks yet
                </div>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <ServiceTaskCard
                key={task.id}
                task={task}
                variant="completed"
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      {selectedTaskId && (
        <AddRepairItemForm
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
          serviceId={selectedTaskId}
          spareparts={spareparts}
          servicePricelists={servicePricelists}
          onSuccess={fetchTasks}
          onError={setError}
        />
      )}

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Service Status</DialogTitle>
            <DialogDescription>
              Change the status of this service
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value) => value && setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="repairing">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}