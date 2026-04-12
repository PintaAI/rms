"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  removeServiceItem,
  getTechnicianSpareparts,
  getTechnicianServicePricelists,
  type TechnicianTaskItem,
} from "@/actions/dashboard";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiPlayCircleLine,
  RiLockLine,
} from "@remixicon/react";
import { AddRepairItemForm } from "@/components/technician/add-repair-item-form";
import { PatternLock } from "@/components/pattern-lock";

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string; defaultPrice: number }>>([]);
  const [servicePricelists, setServicePricelists] = useState<Array<{ id: string; title: string; defaultPrice: number }>>([]);

  // Status dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTaskId, setStatusTaskId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pattern lock dialog state
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [patternTaskId, setPatternTaskId] = useState<string>("");
  const [savedPattern, setSavedPattern] = useState<number[]>([]);
  const [verifyPattern, setVerifyPattern] = useState<number[]>([]);
  const [patternMatch, setPatternMatch] = useState<boolean | null>(null);

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

  // Pattern lock functions
  function openPatternDialog(task: TechnicianTaskItem) {
    setPatternTaskId(task.id);
    setPatternMatch(null);
    setVerifyPattern([]);
    
    // Parse saved pattern from string (format: "0-1-2-3")
    if (task.passwordPattern) {
      const patternArray = task.passwordPattern
        .split("-")
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n));
      setSavedPattern(patternArray);
    } else {
      setSavedPattern([]);
    }
    
    setPatternDialogOpen(true);
  }

  const handleVerifyPatternComplete = useCallback((pattern: number[]) => {
    setVerifyPattern(pattern);
    
    // Compare patterns
    const isMatch =
      pattern.length === savedPattern.length &&
      pattern.every((dot, index) => dot === savedPattern[index]);
    
    setPatternMatch(isMatch);
  }, [savedPattern]);

  function closePatternDialog() {
    setPatternDialogOpen(false);
    setPatternTaskId("");
    setSavedPattern([]);
    setVerifyPattern([]);
    setPatternMatch(null);
  }

  // Helper to parse pattern string for display
  function parsePatternString(patternStr: string | null): number[] {
    if (!patternStr) return [];
    return patternStr
      .split("-")
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n));
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

                    {/* Password / Pattern */}
                    {(task.passwordPattern || task.imei) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {task.passwordPattern && (
                          <div>
                            <Label className="text-muted-foreground">Password / Pattern</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {task.passwordPattern.includes("-") ? (
                                <>
                                  <Badge variant="outline" className="font-mono">
                                    Pattern: {parsePatternString(task.passwordPattern).join(" → ")}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openPatternDialog(task)}
                                  >
                                    <RiLockLine className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline" className="font-mono">
                                  {task.passwordPattern}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {task.imei && (
                          <div>
                            <Label className="text-muted-foreground">IMEI</Label>
                            <p className="text-sm font-mono">{task.imei}</p>
                          </div>
                        )}
                      </div>
                    )}

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

      {/* Pattern Lock View Dialog */}
      <Dialog open={patternDialogOpen} onOpenChange={setPatternDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pattern Lock</DialogTitle>
            <DialogDescription>
              View the saved pattern for this device
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Saved Pattern Display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Saved Pattern</Label>
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg border">
                <PatternLock
                  width={200}
                  height={200}
                  autoReset={false}
                  disabled
                  showPatternNumbers
                  primaryColor="#22c55e"
                />
              </div>
              {savedPattern.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Pattern: {savedPattern.join(" → ")}
                </p>
              )}
              {!savedPattern.length && (
                <p className="text-center text-sm text-muted-foreground">
                  No pattern saved
                </p>
              )}
            </div>

            {/* Verification Section */}
            {savedPattern.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-muted-foreground">Verify Pattern</Label>
                <p className="text-xs text-muted-foreground">
                  Draw the pattern to verify it matches
                </p>
                <div className="flex justify-center p-4 bg-muted/30 rounded-lg border">
                  <PatternLock
                    width={200}
                    height={200}
                    autoReset={false}
                    error={patternMatch === false}
                    onPatternComplete={handleVerifyPatternComplete}
                  />
                </div>
                {verifyPattern.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Your pattern: {verifyPattern.join(" → ")}
                  </p>
                )}
                {patternMatch === true && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pattern matches!
                  </div>
                )}
                {patternMatch === false && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Pattern does not match
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePatternDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}