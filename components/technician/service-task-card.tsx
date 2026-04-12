"use client";

import { useState, useCallback, useEffect } from "react";
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
  RiAddLine,
  RiDeleteBinLine,
  RiPlayCircleLine,
  RiLockLine,
} from "@remixicon/react";
import { PatternLock } from "@/components/pattern-lock";
import {
  updateServiceStatus,
  removeServiceItem,
  getTechnicianSpareparts,
  getTechnicianServicePricelists,
} from "@/actions/dashboard";
import { AddRepairItemForm } from "@/components/technician/add-repair-item-form";

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

// Parse pattern string to array
function parsePatternString(patternStr: string | null): number[] {
  if (!patternStr) return [];
  return patternStr
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n));
}

export interface ServiceTaskItem {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  passwordPattern: string | null;
  imei: string | null;
  status: string;
  checkinAt: Date;
  doneAt: Date | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  items: Array<{
    id: string;
    type: string;
    name: string;
    qty: number;
    price: number;
  }>;
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
}

export interface ServiceTaskCardProps {
  task: ServiceTaskItem;
  variant?: "active" | "completed";
  onUpdateStatus?: (taskId: string, currentStatus: string) => void;
  onAddItem?: (task: ServiceTaskItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onRefresh?: () => void;
}

export function ServiceTaskCard({
  task,
  variant = "active",
  onUpdateStatus,
  onAddItem,
  onRemoveItem,
  onRefresh,
}: ServiceTaskCardProps) {
  const isActive = variant === "active";

  // Pattern lock dialog state
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [savedPattern, setSavedPattern] = useState<number[]>([]);
  const [verifyPattern, setVerifyPattern] = useState<number[]>([]);
  const [patternMatch, setPatternMatch] = useState<boolean | null>(null);

  // Status update dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string; defaultPrice: number; stock: number }>>([]);
  const [servicePricelists, setServicePricelists] = useState<Array<{ id: string; title: string; defaultPrice: number }>>([]);

  // Fetch spareparts and pricelists
  useEffect(() => {
    async function fetchData() {
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
    }
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

  // Handle update status
  async function handleUpdateStatus() {
    if (!newStatus) return;
    setIsUpdatingStatus(true);
    try {
      const result = await updateServiceStatus(task.id, newStatus as any);
      if (result.success) {
        setStatusDialogOpen(false);
        onRefresh?.();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Handle remove item
  async function handleRemoveItem(itemId: string) {
    try {
      const result = await removeServiceItem(itemId);
      if (result.success) {
        onRefresh?.();
      }
    } catch (err) {
      console.error("Error removing item:", err);
    }
  }

  // Open status dialog
  function openStatusDialog() {
    setNewStatus(task.status);
    setStatusDialogOpen(true);
  }

  // Open add item dialog
  function openAddItemDialog() {
    setItemDialogOpen(true);
  }

  function openPatternDialog() {
    if (task.passwordPattern) {
      const patternArray = parsePatternString(task.passwordPattern);
      setSavedPattern(patternArray);
    } else {
      setSavedPattern([]);
    }
    setPatternMatch(null);
    setVerifyPattern([]);
    setPatternDialogOpen(true);
  }

  const handleVerifyPatternComplete = useCallback((pattern: number[]) => {
    setVerifyPattern(pattern);
    
    const isMatch =
      pattern.length === savedPattern.length &&
      pattern.every((dot, index) => dot === savedPattern[index]);
    
    setPatternMatch(isMatch);
  }, [savedPattern]);

  function closePatternDialog() {
    setPatternDialogOpen(false);
    setSavedPattern([]);
    setVerifyPattern([]);
    setPatternMatch(null);
  }

  const totalAmount = task.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <Card>
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
            {isActive && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onUpdateStatus) {
                      onUpdateStatus(task.id, task.status);
                    } else {
                      openStatusDialog();
                    }
                  }}
                >
                  <RiPlayCircleLine className="h-4 w-4 mr-1" />
                  Update Status
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onAddItem) {
                      onAddItem(task);
                    } else {
                      openAddItemDialog();
                    }
                  }}
                >
                  <RiAddLine className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Complaint */}
            <div>
              <Label className="text-muted-foreground">Complaint</Label>
              <p className="text-sm">{task.complaint}</p>
            </div>

            {/* Password / Pattern - only show for active tasks */}
            {isActive && (task.passwordPattern || task.imei) && (
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
                            onClick={openPatternDialog}
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
                      {isActive && <TableHead></TableHead>}
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
                        {isActive && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveItem?.(item.id)}
                            >
                              <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {task.items.length === 0 && isActive && (
              <div>
                <Label className="text-muted-foreground">Repair Items</Label>
                <p className="text-sm text-muted-foreground">No items added yet</p>
              </div>
            )}

            {/* Total */}
            {task.items.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="font-bold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}

            {/* Invoice info */}
            {task.invoice && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">
                  {isActive ? "Invoice Status" : "Invoice"}
                </span>
                <div className="flex items-center gap-2">
                  {!isActive && <span>{formatCurrency(task.invoice.grandTotal)}</span>}
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

      {/* Add Item Dialog */}
      <AddRepairItemForm
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        serviceId={task.id}
        spareparts={spareparts}
        servicePricelists={servicePricelists}
        onSuccess={() => {
          setItemDialogOpen(false);
          onRefresh?.();
        }}
        onError={(err) => console.error("Error adding item:", err)}
      />
    </>
  );
}