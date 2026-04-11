"use client";

import { useState, useEffect, useRef } from "react";
import {
  createService,
  searchHpCatalogs,
  createHpCatalog,
} from "@/actions/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HpCatalogOption {
  id: string;
  modelName: string;
  brandName: string;
}

interface AddServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddServiceForm({
  open,
  onOpenChange,
  onSuccess,
}: AddServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device autocomplete state
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceResults, setDeviceResults] = useState<HpCatalogOption[]>([]);
  const [selectedDevice, setSelectedDevice] =
    useState<HpCatalogOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
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

  // Search devices when query changes
  useEffect(() => {
    if (!deviceQuery.trim()) {
      setDeviceResults([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if a device is already selected and query matches it
    if (
      selectedDevice &&
      `${selectedDevice.brandName} ${selectedDevice.modelName}` === deviceQuery
    ) {
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const timeoutId = setTimeout(async () => {
      const result = await searchHpCatalogs(deviceQuery);
      if (result.success && result.data) {
        setDeviceResults(result.data);
      } else {
        setDeviceResults([]);
      }
      setIsSearching(false);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [deviceQuery, selectedDevice]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDeviceQuery("");
      setDeviceResults([]);
      setSelectedDevice(null);
      setError(null);
    }
  }, [open]);

  function handleDeviceSelect(device: HpCatalogOption) {
    setSelectedDevice(device);
    setDeviceQuery(`${device.brandName} ${device.modelName}`);
    setShowDropdown(false);
  }

  async function handleCreateNewDevice() {
    if (!deviceQuery.trim()) return;

    setIsCreatingDevice(true);
    setError(null);

    // Parse brand and model from input
    // Format: "Brand Model" or just "Model"
    const parts = deviceQuery.trim().split(/\s+/);
    let brandName = "";
    let modelName = "";

    if (parts.length >= 2) {
      // Assume first word is brand, rest is model
      brandName = parts[0];
      modelName = parts.slice(1).join(" ");
    } else {
      // Only one word - use as model with generic brand
      brandName = "Unknown";
      modelName = parts[0];
    }

    const result = await createHpCatalog({
      brandName,
      modelName,
    });

    setIsCreatingDevice(false);

    if (result.success && result.data) {
      setSelectedDevice(result.data);
      setDeviceQuery(`${result.data.brandName} ${result.data.modelName}`);
      setShowDropdown(false);
    } else {
      setError(result.error || "Failed to create device");
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Check if device is selected
    if (!selectedDevice) {
      // Try to create a new device from the query
      if (deviceQuery.trim()) {
        await handleCreateNewDevice();
        if (!selectedDevice) {
          setIsLoading(false);
          return; // Error was already set
        }
      } else {
        setError("Please select or enter a device");
        setIsLoading(false);
        return;
      }
    }

    const result = await createService({
      hpCatalogId: selectedDevice.id,
      customerName: (formData.get("customerName") as string) || undefined,
      noWa: formData.get("noWa") as string,
      complaint: formData.get("complaint") as string,
      passwordPattern:
        (formData.get("passwordPattern") as string) || undefined,
      imei: (formData.get("imei") as string) || undefined,
    });

    setIsLoading(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.error || "Failed to create service");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Service Ticket</DialogTitle>
          <DialogDescription>
            Fill in the customer and device details to create a new service
            ticket. Device will be auto-created if it doesn't exist.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* Device - Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="device">Device *</Label>
            <div className="relative" ref={dropdownRef}>
              <Input
                ref={inputRef}
                id="device"
                name="deviceQuery"
                value={deviceQuery}
                onChange={(e) => {
                  setDeviceQuery(e.target.value);
                  setSelectedDevice(null); // Clear selection when typing
                }}
                onFocus={() => {
                  if (deviceQuery.trim()) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Type to search or enter new device (e.g. Samsung Galaxy S21)"
                disabled={isLoading || isCreatingDevice}
                autoComplete="off"
              />

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
                  {isSearching ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : deviceResults.length > 0 ? (
                    deviceResults.map((device) => (
                      <button
                        key={device.id}
                        type="button"
                        className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                        onClick={() => handleDeviceSelect(device)}
                      >
                        {device.brandName} {device.modelName}
                      </button>
                    ))
                  ) : deviceQuery.trim() ? (
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        No matching device found
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewDevice}
                        disabled={isCreatingDevice}
                      >
                        {isCreatingDevice
                          ? "Creating..."
                          : `Create "${deviceQuery}"`}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Selected device indicator */}
              {selectedDevice && !showDropdown && (
                <div className="text-xs text-muted-foreground mt-1">
                  ✓ Selected: {selectedDevice.brandName}{" "}
                  {selectedDevice.modelName}
                </div>
              )}
            </div>
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              name="customerName"
              placeholder="Enter customer name (optional)"
              disabled={isLoading}
            />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="noWa">WhatsApp Number *</Label>
            <Input
              id="noWa"
              name="noWa"
              placeholder="e.g. 08123456789"
              required
              disabled={isLoading}
            />
          </div>

          {/* Complaint */}
          <div className="space-y-2">
            <Label htmlFor="complaint">Complaint *</Label>
            <textarea
              id="complaint"
              name="complaint"
              placeholder="Describe the issue..."
              required
              disabled={isLoading}
              rows={3}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Password Pattern */}
          <div className="space-y-2">
            <Label htmlFor="passwordPattern">Password / Pattern</Label>
            <Input
              id="passwordPattern"
              name="passwordPattern"
              placeholder="Device password or pattern (optional)"
              disabled={isLoading}
            />
          </div>

          {/* IMEI */}
          <div className="space-y-2">
            <Label htmlFor="imei">IMEI</Label>
            <Input
              id="imei"
              name="imei"
              placeholder="Device IMEI (optional)"
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isCreatingDevice}>
              {isLoading ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
