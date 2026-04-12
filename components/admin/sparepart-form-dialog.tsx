"use client";

import { useEffect, useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  createSparepart,
  updateSparepart,
  type Sparepart,
  type SparepartWithCompatibilities,
} from "@/actions/inventory";
import { searchHpCatalogs } from "@/actions/dashboard";
import { cn } from "@/lib/utils";
import { RiCloseLine, RiAddLine } from "@remixicon/react";

interface HpCatalogOption {
  id: string;
  modelName: string;
  brandName: string;
}

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
  const [isUniversal, setIsUniversal] = useState(false);

  // Device compatibility state
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceResults, setDeviceResults] = useState<HpCatalogOption[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<HpCatalogOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize form when sparepart changes
  useEffect(() => {
    if (sparepart) {
      setName(sparepart.name);
      setDefaultPrice(sparepart.defaultPrice.toString());
      setIsUniversal(sparepart.isUniversal);
      // Initialize selected devices from existing compatibilities
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
      setIsUniversal(false);
      setSelectedDevices([]);
    }
    setError(null);
    setDeviceQuery("");
    setDeviceResults([]);
  }, [sparepart, open]);

  // Search devices when query changes
  useEffect(() => {
    if (!deviceQuery.trim()) {
      setDeviceResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const timeoutId = setTimeout(async () => {
      const result = await searchHpCatalogs(deviceQuery);
      if (result.success && result.data) {
        // Filter out already selected devices
        const filtered = result.data.filter(
          (d) => !selectedDevices.some((s) => s.id === d.id)
        );
        setDeviceResults(filtered);
      } else {
        setDeviceResults([]);
      }
      setIsSearching(false);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [deviceQuery, selectedDevices]);

  function handleDeviceSelect(device: HpCatalogOption) {
    setSelectedDevices((prev) => [...prev, device]);
    setDeviceQuery("");
    setDeviceResults([]);
    setShowDropdown(false);
  }

  function handleRemoveDevice(deviceId: string) {
    setSelectedDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }

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

      const hpCatalogIds = selectedDevices.map((d) => d.id);

      // If no devices selected, default to universal
      const finalIsUniversal = hpCatalogIds.length === 0 ? true : isUniversal;

      let result;
      if (sparepart) {
        result = await updateSparepart({
          id: sparepart.id,
          name,
          defaultPrice: price,
          isUniversal: finalIsUniversal,
          hpCatalogIds,
        });
      } else {
        result = await createSparepart({
          name,
          defaultPrice: price,
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
            {selectedDevices.length === 0 && !isUniversal && (
              <p className="text-xs text-muted-foreground">
                Note: If no compatible devices are selected, the sparepart will be automatically set as universal.
              </p>
            )}

            {/* Device Compatibility Section */}
            <div className="space-y-2">
              <Label>Compatible Devices</Label>
              {/* Selected devices badges */}
              {selectedDevices.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedDevices.map((device) => (
                    <Badge
                      key={device.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      <span>
                        {device.brandName} {device.modelName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <RiCloseLine className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Device search input */}
              <div className="relative" ref={dropdownRef}>
                <Input
                  ref={inputRef}
                  value={deviceQuery}
                  onChange={(e) => setDeviceQuery(e.target.value)}
                  placeholder="Search device to add compatibility..."
                  className="w-full"
                />
                {/* Dropdown results */}
                {showDropdown && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {isSearching ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Searching...
                      </div>
                    ) : deviceResults.length > 0 ? (
                      deviceResults.map((device) => (
                        <button
                          key={device.id}
                          type="button"
                          onClick={() => handleDeviceSelect(device)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                          )}
                        >
                          <RiAddLine className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{device.brandName}</span>
                          <span className="text-muted-foreground">
                            {device.modelName}
                          </span>
                        </button>
                      ))
                    ) : deviceQuery.trim() ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        No devices found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Search and select device models this sparepart is compatible
                with. Leave empty if universal.
              </p>
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