"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  addServiceItem,
  removeServiceItem,
  getTechnicianSpareparts,
  getTechnicianServicePricelists,
  type TechnicianTaskItem,
} from "@/actions/dashboard";
import {
  RiToolsLine,
  RiAddLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiPlayCircleLine,
} from "@remixicon/react";

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
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TechnicianTasksPage() {
  const [tasks, setTasks] = useState<TechnicianTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TechnicianTaskItem | null>(null);
  const [itemType, setItemType] = useState<"sparepart" | "service">("sparepart");
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string; defaultPrice: number }>>([]);
  const [servicePricelists, setServicePricelists] = useState<Array<{ id: string; title: string; defaultPrice: number }>>([]);
  const [selectedSparepartId, setSelectedSparepartId] = useState<string>("");
  const [selectedPricelistId, setSelectedPricelistId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

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
    setSelectedTask(task);
    setItemType("sparepart");
    setSelectedSparepartId("");
    setSelectedPricelistId("");
    setCustomName("");
    setItemQty("1");
    setItemPrice("");
    setItemDialogOpen(true);
  }

  function handleSparepartSelect(sparepartId: string) {
    setSelectedSparepartId(sparepartId);
    const sparepart = spareparts.find((s) => s.id === sparepartId);
    if (sparepart) {
      setCustomName(sparepart.name);
      setItemPrice(sparepart.defaultPrice.toString());
    }
  }

  function handlePricelistSelect(pricelistId: string) {
    setSelectedPricelistId(pricelistId);
    const pricelist = servicePricelists.find((p) => p.id === pricelistId);
    if (pricelist) {
      setCustomName(pricelist.title);
      setItemPrice(pricelist.defaultPrice.toString());
    }
  }

  async function handleAddItem() {
    if (!selectedTask) return;

    if (!customName || !itemQty || !itemPrice) {
      setError("Please fill in all fields");
      return;
    }

    setIsAddingItem(true);
    setError(null);

    try {
      const result = await addServiceItem({
        serviceId: selectedTask.id,
        type: itemType,
        sparepartId: itemType === "sparepart" ? selectedSparepartId : undefined,
        name: customName,
        qty: parseInt(itemQty, 10),
        price: parseInt(itemPrice, 10),
      });

      if (result.success) {
        setItemDialogOpen(false);
        await fetchTasks();
      } else {
        setError(result.error || "Failed to add item");
      }
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
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
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {task.hpCatalog.brand.name} {task.hpCatalog.modelName}
                        <Badge variant={statusColors[task.status] || "outline"}>
                          {statusLabels[task.status] || task.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {task.customerName || "No customer name"} • {task.noWa}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStatusDialog(task.id, task.status)}
                      >
                        <RiPlayCircleLine className="h-4 w-4 mr-1" />
                        Update Status
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openItemDialog(task)}
                      >
                        <RiAddLine className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Complaint */}
                    <div>
                      <Label className="text-muted-foreground">Complaint</Label>
                      <p className="text-sm">{task.complaint}</p>
                    </div>

                    {/* Items */}
                    <div>
                      <Label className="text-muted-foreground">Repair Items</Label>
                      {task.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No items added yet</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {task.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Badge variant="outline">
                                    {item.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.price * item.qty)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    {/* Total */}
                    {task.items.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Total</span>
                        <span className="font-bold">
                          {formatCurrency(
                            task.items.reduce((sum, item) => sum + item.price * item.qty, 0)
                          )}
                        </span>
                      </div>
                    )}

                    {/* Invoice info */}
                    {task.invoice && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Invoice Status</span>
                        <Badge
                          variant={
                            task.invoice.paymentStatus === "paid"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {task.invoice.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div>Check-in: {formatDate(task.checkinAt)}</div>
                      {task.doneAt && <div>Done: {formatDate(task.doneAt)}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {task.hpCatalog.brand.name} {task.hpCatalog.modelName}
                        <Badge variant={statusColors[task.status] || "outline"}>
                          {statusLabels[task.status] || task.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {task.customerName || "No customer name"} • {task.noWa}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Complaint */}
                    <div>
                      <Label className="text-muted-foreground">Complaint</Label>
                      <p className="text-sm">{task.complaint}</p>
                    </div>

                    {/* Items */}
                    {task.items.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Repair Items</Label>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {task.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Badge variant="outline">
                                    {item.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.price * item.qty)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Total */}
                    {task.items.length > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Total</span>
                        <span className="font-bold">
                          {formatCurrency(
                            task.items.reduce((sum, item) => sum + item.price * item.qty, 0)
                          )}
                        </span>
                      </div>
                    )}

                    {/* Invoice info */}
                    {task.invoice && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Invoice</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(task.invoice.grandTotal)}</span>
                          <Badge
                            variant={
                              task.invoice.paymentStatus === "paid"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {task.invoice.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div>Check-in: {formatDate(task.checkinAt)}</div>
                      {task.doneAt && <div>Done: {formatDate(task.doneAt)}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repair Item</DialogTitle>
            <DialogDescription>
              Add spareparts or services to this repair task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Item Type</Label>
              <Select
                value={itemType}
                onValueChange={(value) => {
                  setItemType(value as "sparepart" | "service");
                  setSelectedSparepartId("");
                  setSelectedPricelistId("");
                  setCustomName("");
                  setItemPrice("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sparepart">Sparepart</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {itemType === "sparepart" && (
              <div>
                <Label>Select Sparepart (optional)</Label>
                <Select
                  value={selectedSparepartId}
                  onValueChange={(value) => value && handleSparepartSelect(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sparepart" />
                  </SelectTrigger>
                  <SelectContent>
                    {spareparts.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name} - {formatCurrency(sp.defaultPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {itemType === "service" && (
              <div>
                <Label>Select Service (optional)</Label>
                <Select
                  value={selectedPricelistId}
                  onValueChange={(value) => value && handlePricelistSelect(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicePricelists.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.title} - {formatCurrency(sp.defaultPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Item name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label>Price (IDR)</Label>
                <Input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={isAddingItem}>
              {isAddingItem ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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