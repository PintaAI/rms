"use client";

import { useEffect, useState } from "react";
import { useToko } from "@/components/toko-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getSpareparts,
  createSparepart,
  updateSparepart,
  deleteSparepart,
  getServicePricelists,
  createServicePricelist,
  updateServicePricelist,
  deleteServicePricelist,
  type Sparepart,
  type ServicePricelist,
} from "@/actions/inventory";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiStore2Line,
  RiToolsLine,
  RiFileList3Line,
  RiMoneyDollarCircleLine,
} from "@remixicon/react";

// Format currency (Indonesian Rupiah)
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Sparepart Form Dialog
interface SparepartFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparepart?: Sparepart | null;
  tokoId: string;
  onSuccess: () => void;
}

function SparepartFormDialog({
  open,
  onOpenChange,
  sparepart,
  tokoId,
  onSuccess,
}: SparepartFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [isUniversal, setIsUniversal] = useState(false);

  useEffect(() => {
    if (sparepart) {
      setName(sparepart.name);
      setDefaultPrice(sparepart.defaultPrice.toString());
      setIsUniversal(sparepart.isUniversal);
    } else {
      setName("");
      setDefaultPrice("");
      setIsUniversal(false);
    }
    setError(null);
  }, [sparepart, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const price = parseInt(defaultPrice, 10);
      if (isNaN(price) || price < 0) {
        setError("Price must be a valid number");
        setIsLoading(false);
        return;
      }

      let result;
      if (sparepart) {
        result = await updateSparepart({
          id: sparepart.id,
          name,
          defaultPrice: price,
          isUniversal,
        });
      } else {
        result = await createSparepart({
          name,
          defaultPrice: price,
          isUniversal,
          tokoId,
        });
      }

      if (result.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(result.error || "Failed to save sparepart");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sparepart ? "Edit Sparepart" : "Add Sparepart"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., LCD iPhone 13"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Default Price</Label>
              <Input
                id="price"
                type="number"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUniversal"
                checked={isUniversal}
                onCheckedChange={(checked) => setIsUniversal(checked === true)}
              />
              <Label htmlFor="isUniversal">Universal (can be used on any device)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : sparepart ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Service Pricelist Form Dialog
interface PricelistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricelist?: ServicePricelist | null;
  tokoId: string;
  onSuccess: () => void;
}

function PricelistFormDialog({
  open,
  onOpenChange,
  pricelist,
  tokoId,
  onSuccess,
}: PricelistFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");

  useEffect(() => {
    if (pricelist) {
      setTitle(pricelist.title);
      setDefaultPrice(pricelist.defaultPrice.toString());
    } else {
      setTitle("");
      setDefaultPrice("");
    }
    setError(null);
  }, [pricelist, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const price = parseInt(defaultPrice, 10);
      if (isNaN(price) || price < 0) {
        setError("Price must be a valid number");
        setIsLoading(false);
        return;
      }

      let result;
      if (pricelist) {
        result = await updateServicePricelist({
          id: pricelist.id,
          title,
          defaultPrice: price,
        });
      } else {
        result = await createServicePricelist({
          title,
          defaultPrice: price,
          tokoId,
        });
      }

      if (result.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(result.error || "Failed to save service pricelist");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pricelist ? "Edit Service" : "Add Service"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Screen Replacement"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Default Price</Label>
              <Input
                id="price"
                type="number"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : pricelist ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to delete <strong>{title}</strong>? This
            action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [pricelists, setPricelists] = useState<ServicePricelist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [sparepartDialogOpen, setSparepartDialogOpen] = useState(false);
  const [editingSparepart, setEditingSparepart] = useState<Sparepart | null>(null);
  const [pricelistDialogOpen, setPricelistDialogOpen] = useState(false);
  const [editingPricelist, setEditingPricelist] = useState<ServicePricelist | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "sparepart" | "pricelist";
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchData() {
    if (!selectedToko) {
      setSpareparts([]);
      setPricelists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [sparepartResult, pricelistResult] = await Promise.all([
        getSpareparts(selectedToko.id),
        getServicePricelists(selectedToko.id),
      ]);

      if (sparepartResult.success && sparepartResult.data) {
        setSpareparts(sparepartResult.data);
      }
      if (pricelistResult.success && pricelistResult.data) {
        setPricelists(pricelistResult.data);
      }
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setError("Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [selectedToko]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      let result;
      if (deleteTarget.type === "sparepart") {
        result = await deleteSparepart(deleteTarget.id);
      } else {
        result = await deleteServicePricelist(deleteTarget.id);
      }

      if (result.success) {
        await fetchData();
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      } else {
        setError(result.error || "Failed to delete");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  function openSparepartDialog(sparepart?: Sparepart) {
    setEditingSparepart(sparepart || null);
    setSparepartDialogOpen(true);
  }

  function openPricelistDialog(pricelist?: ServicePricelist) {
    setEditingPricelist(pricelist || null);
    setPricelistDialogOpen(true);
  }

  function openDeleteDialog(type: "sparepart" | "pricelist", id: string, title: string) {
    setDeleteTarget({ type, id, title });
    setDeleteDialogOpen(true);
  }

  // Loading state
  if (tokoLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // No toko selected
  if (!selectedToko) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiStore2Line className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Toko Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please select a toko from the sidebar to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{selectedToko.name} Inventory</h1>
        <p className="text-muted-foreground">
          Manage spareparts and service prices for this toko
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="spareparts">
        <TabsList>
          <TabsTrigger value="spareparts" className="gap-2">
            <RiToolsLine className="h-4 w-4" />
            Spareparts ({spareparts.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <RiFileList3Line className="h-4 w-4" />
            Services ({pricelists.length})
          </TabsTrigger>
        </TabsList>

        {/* Spareparts Tab */}
        <TabsContent value="spareparts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spareparts</CardTitle>
                <CardDescription>
                  Manage spareparts available for repairs
                </CardDescription>
              </div>
              <Button onClick={() => openSparepartDialog()}>
                <RiAddLine className="h-4 w-4 mr-2" />
                Add Sparepart
              </Button>
            </CardHeader>
            <CardContent>
              {spareparts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No spareparts found. Add your first sparepart to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Default Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spareparts.map((sparepart) => (
                      <TableRow key={sparepart.id}>
                        <TableCell className="font-medium">
                          {sparepart.name}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sparepart.defaultPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sparepart.isUniversal ? "default" : "secondary"}>
                            {sparepart.isUniversal ? "Universal" : "Specific"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openSparepartDialog(sparepart)}
                            >
                              <RiEditLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                openDeleteDialog(
                                  "sparepart",
                                  sparepart.id,
                                  sparepart.name
                                )
                              }
                            >
                              <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Service Pricelist</CardTitle>
                <CardDescription>
                  Manage service types and their default prices
                </CardDescription>
              </div>
              <Button onClick={() => openPricelistDialog()}>
                <RiAddLine className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              {pricelists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No services found. Add your first service to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Title</TableHead>
                      <TableHead>Default Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricelists.map((pricelist) => (
                      <TableRow key={pricelist.id}>
                        <TableCell className="font-medium">
                          {pricelist.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RiMoneyDollarCircleLine className="h-4 w-4 text-muted-foreground" />
                            {formatCurrency(pricelist.defaultPrice)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openPricelistDialog(pricelist)}
                            >
                              <RiEditLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                openDeleteDialog(
                                  "pricelist",
                                  pricelist.id,
                                  pricelist.title
                                )
                              }
                            >
                              <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SparepartFormDialog
        open={sparepartDialogOpen}
        onOpenChange={setSparepartDialogOpen}
        sparepart={editingSparepart}
        tokoId={selectedToko.id}
        onSuccess={fetchData}
      />

      <PricelistFormDialog
        open={pricelistDialogOpen}
        onOpenChange={setPricelistDialogOpen}
        pricelist={editingPricelist}
        tokoId={selectedToko.id}
        onSuccess={fetchData}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}