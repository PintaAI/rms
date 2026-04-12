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
import { searchHpCatalogs, searchBrands, createHpCatalog } from "@/actions/dashboard";
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
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isUniversal, setIsUniversal] = useState(false);

  // Device compatibility state
  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceResults, setDeviceResults] = useState<HpCatalogOption[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<HpCatalogOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Brand inline ghost autocomplete state
  const [brandGhostSuffix, setBrandGhostSuffix] = useState<string>("");
  const [matchedBrand, setMatchedBrand] = useState<string | null>(null);

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
      setStock(sparepart.stock.toString());
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
      setStock("");
      setIsUniversal(false);
      setSelectedDevices([]);
    }
    setError(null);
    setDeviceQuery("");
    setDeviceResults([]);
    setBrandGhostSuffix("");
    setMatchedBrand(null);
  }, [sparepart, open]);

  // Auto-uncheck universal when devices are selected
  useEffect(() => {
    if (selectedDevices.length > 0 && isUniversal) {
      setIsUniversal(false);
    }
  }, [selectedDevices, isUniversal]);

  // Brand inline ghost autocomplete - triggers on first word
  useEffect(() => {
    if (!deviceQuery.trim() || selectedDevices.length > 0) {
      setBrandGhostSuffix("");
      setMatchedBrand(null);
      return;
    }

    const parts = deviceQuery.trim().split(/\s+/);
    const firstWord = parts[0];

    // Only show ghost when typing the first word (no space yet, or just started)
    const isTypingFirstWord = !deviceQuery.includes(" ");

    if (!isTypingFirstWord) {
      setBrandGhostSuffix("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      const result = await searchBrands(firstWord);
      if (result.success && result.data && result.data.length > 0) {
        const startMatch = result.data.find((b) =>
          b.name.toLowerCase().startsWith(firstWord.toLowerCase())
        );

        if (startMatch) {
          const suffix = startMatch.name.slice(firstWord.length);
          setBrandGhostSuffix(suffix);
          setMatchedBrand(startMatch.name);
        } else {
          setBrandGhostSuffix("");
          setMatchedBrand(null);
        }
      } else {
        setBrandGhostSuffix("");
        setMatchedBrand(null);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [deviceQuery, selectedDevices]);

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

  // Accept brand ghost suggestion on Tab or ArrowRight at end
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Tab" || e.key === "ArrowRight") && brandGhostSuffix) {
      e.preventDefault();
      const completed = `${matchedBrand} `;
      setDeviceQuery(completed);
      setBrandGhostSuffix("");
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const len = completed.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
    }
  }

  async function handleCreateNewDevice() {
    if (!deviceQuery.trim()) return;

    setIsCreatingDevice(true);
    setError(null);

    const parts = deviceQuery.trim().split(/\s+/);
    let brandName = "";
    let modelName = "";

    if (parts.length >= 2) {
      brandName = matchedBrand || parts[0];
      modelName = parts.slice(1).join(" ");
    } else if (matchedBrand) {
      brandName = matchedBrand;
      modelName = parts[0];
    } else {
      brandName = "Unknown";
      modelName = parts[0];
    }

    const result = await createHpCatalog({
      brandName,
      modelName,
    });

    setIsCreatingDevice(false);

    if (result.success && result.data) {
      // Check if already selected
      if (selectedDevices.some((s) => s.id === result.data!.id)) {
        setDeviceQuery("");
        setShowDropdown(false);
        return;
      }
      setSelectedDevices((prev) => [...prev, result.data!]);
      setDeviceQuery("");
      setDeviceResults([]);
      setShowDropdown(false);
    } else {
      setError(result.error || "Failed to create device");
    }
  }

  function handleDeviceSelect(device: HpCatalogOption) {
    // Check if already selected
    if (selectedDevices.some((s) => s.id === device.id)) {
      setShowDropdown(false);
      return;
    }
    setSelectedDevices((prev) => [...prev, device]);
    setDeviceQuery("");
    setDeviceResults([]);
    setShowDropdown(false);
    setBrandGhostSuffix("");
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

      const stockValue = parseInt(stock, 10);
      if (isNaN(stockValue) || stockValue < 0) {
        setError("Stock must be a valid number");
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
            {/* Universal checkbox - only show when no devices selected */}
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

              {/* Device search input with brand ghost autocomplete */}
              <div className="relative" ref={dropdownRef}>
                {/* Ghost text overlay */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center rounded-md border border-transparent px-3 text-sm"
                >
                  <span className="invisible whitespace-pre">{deviceQuery}</span>
                  {brandGhostSuffix && (
                    <>
                      <span className="text-muted-foreground/50 select-none">
                        {brandGhostSuffix}
                      </span>
                      <span className="ml-1.5 inline-flex items-center rounded border border-muted-foreground/30 bg-muted px-1 py-px font-mono text-[10px] text-muted-foreground/60 select-none leading-none">
                        Tab
                      </span>
                    </>
                  )}
                </div>

                <Input
                  ref={inputRef}
                  value={deviceQuery}
                  onChange={(e) => setDeviceQuery(e.target.value)}
                  onFocus={() => {
                    if (deviceQuery.trim()) {
                      setShowDropdown(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search or type new device..."
                  className={cn(
                    "w-full bg-transparent border border-input shadow-sm",
                    selectedDevices.length > 0 && "border-green-500/50 bg-green-500/5"
                  )}
                  disabled={isLoading || isCreatingDevice}
                  autoComplete="off"
                />

                {/* Ghost hint label */}
                {brandGhostSuffix && !showDropdown && (
                  <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Press{" "}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      Tab
                    </kbd>{" "}
                    to accept <span className="font-medium text-foreground">{matchedBrand}</span>
                  </div>
                )}

                {/* Dropdown results */}
                {showDropdown && (
                  <div
                    className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {isSearching ? (
                      <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Searching devices...
                      </div>
                    ) : deviceResults.length > 0 ? (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Existing Devices
                        </div>
                        {deviceResults.map((device) => (
                          <button
                            key={device.id}
                            type="button"
                            className="w-full px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors flex items-center justify-between group"
                            onClick={() => handleDeviceSelect(device)}
                          >
                            <span>
                              <span className="font-medium">{device.brandName}</span>
                              <span className="text-muted-foreground ml-1">{device.modelName}</span>
                            </span>
                            <svg
                              className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    ) : deviceQuery.trim() ? (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          No existing device found
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateNewDevice}
                          disabled={isCreatingDevice}
                          className="w-full"
                        >
                          {isCreatingDevice ? (
                            <>
                              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Creating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create "{deviceQuery}"
                            </>
                          )}
                        </Button>
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