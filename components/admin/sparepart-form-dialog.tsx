"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSparepart,
  updateSparepart,
  type SparepartWithCompatibilities,
} from "@/actions/inventory";
import { MultiDeviceInput, type HpCatalogOption } from "@/components/admin/multi-device-input";

interface SparepartFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparepart?: SparepartWithCompatibilities | null;
  tokoId: string;
  onSuccess: () => void;
}

export function SparepartFormDialog({
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
  const [stock, setStock] = useState("");
  const [isUniversal, setIsUniversal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<HpCatalogOption[]>([]);

  useEffect(() => {
    if (sparepart) {
      setName(sparepart.name);
      setDefaultPrice(sparepart.defaultPrice.toString());
      setStock(sparepart.stock.toString());
      setIsUniversal(sparepart.isUniversal);
      setSelectedDevices(
        sparepart.compatibilities.map((c) => ({
          id: c.hpCatalog.id,
          modelName: c.hpCatalog.modelName,
          brandName: c.hpCatalog.brand.name,
        }))
      );
    } else {
      setName("");
      setDefaultPrice("");
      setStock("");
      setIsUniversal(false);
      setSelectedDevices([]);
    }
    setError(null);
  }, [sparepart, open]);

  useEffect(() => {
    if (selectedDevices.length > 0 && isUniversal) {
      setIsUniversal(false);
    }
  }, [selectedDevices.length, isUniversal]);

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

      const stockValue = parseInt(stock, 10);
      if (isNaN(stockValue) || stockValue < 0) {
        setError("Stock must be a valid number");
        setIsLoading(false);
        return;
      }

      const hpCatalogIds = selectedDevices.map((d) => d.id);
      const finalIsUniversal = hpCatalogIds.length === 0 ? true : isUniversal;

      let result;
      if (sparepart) {
        result = await updateSparepart({
          id: sparepart.id,
          name,
          defaultPrice: price,
          stock: stockValue,
          isUniversal: finalIsUniversal,
          hpCatalogIds,
        });
      } else {
        result = await createSparepart({
          name,
          defaultPrice: price,
          stock: stockValue,
          isUniversal: finalIsUniversal,
          tokoId,
          hpCatalogIds,
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
      <DialogContent className="max-w-md">
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
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
            {selectedDevices.length === 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUniversal"
                  checked={isUniversal}
                  onCheckedChange={(checked) => setIsUniversal(checked === true)}
                />
                <Label htmlFor="isUniversal">
                  Universal (can be used on any device)
                </Label>
              </div>
            )}
            {!isUniversal && (
              <div className="space-y-2">
                <Label>Compatible Devices</Label>
                <MultiDeviceInput
                  value={selectedDevices}
                  onChange={setSelectedDevices}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Search and select device models this sparepart is compatible with.
                </p>
              </div>
            )}
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