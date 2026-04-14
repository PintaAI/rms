"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  createService,
  updateService,
  searchHpCatalogs,
  createHpCatalog,
  searchBrands,
} from "@/actions/staff";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PatternLock } from "@/components/pattern-lock";

interface HpCatalogOption {
  id: string;
  modelName: string;
  brandName: string;
}

interface ServiceFormData {
  id: string;
  hpCatalogId: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  passwordPattern: string | null;
  imei: string | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
}

// Extended interface to support ServiceListItem from actions/staff
interface ServiceListItem {
  id: string;
  hpCatalogId?: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  passwordPattern?: string | null;
  imei?: string | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
}

interface ServicesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: ServiceFormData | ServiceListItem | null;
}

export function ServicesForm({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: ServicesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form field states for edit mode
  const [customerName, setCustomerName] = useState("");
  const [noWa, setNoWa] = useState("");
  const [complaint, setComplaint] = useState("");
  const [imei, setImei] = useState("");
  const [passwordPatternText, setPasswordPatternText] = useState("");

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

  // Brand inline ghost autocomplete state
  const [brandGhostSuffix, setBrandGhostSuffix] = useState<string>("");
  const [matchedBrand, setMatchedBrand] = useState<string | null>(null);

  // Pattern lock state
  const [pattern, setPattern] = useState<number[]>([]);
  const [showPatternLock, setShowPatternLock] = useState(false);
  const [patternError, setPatternError] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editData && open) {
      setIsEditMode(true);
      // Set device info
      setDeviceQuery(`${editData.hpCatalog.brand.name} ${editData.hpCatalog.modelName}`);
      setSelectedDevice({
        id: editData.hpCatalogId || "",
        modelName: editData.hpCatalog.modelName,
        brandName: editData.hpCatalog.brand.name,
      });
      // Set form field values
      setCustomerName(editData.customerName || "");
      setNoWa(editData.noWa || "");
      setComplaint(editData.complaint || "");
      setImei(editData.imei || "");
      
      // Handle password pattern - check if it's a pattern lock (dash-separated numbers) or text
      const passwordPattern = editData.passwordPattern || "";
      if (passwordPattern && /^[\d-]+$/.test(passwordPattern)) {
        // It's a pattern lock format (e.g., "1-2-3-4")
        const patternArray = passwordPattern.split("-").map(Number);
        setPattern(patternArray);
        setShowPatternLock(true);
        setPasswordPatternText("");
      } else {
        // It's a text password
        setPasswordPatternText(passwordPattern);
        setShowPatternLock(false);
        setPattern([]);
      }
    } else if (!editData && open) {
      setIsEditMode(false);
      // Clear form fields for new service
      setCustomerName("");
      setNoWa("");
      setComplaint("");
      setImei("");
      setPasswordPatternText("");
      setPattern([]);
      setShowPatternLock(false);
    }
  }, [editData, open]);

  // Close dropdown when clicked outside
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

  // Brand inline ghost autocomplete - triggers on first word
  useEffect(() => {
    if (!deviceQuery.trim() || selectedDevice) {
      setBrandGhostSuffix("");
      setMatchedBrand(null);
      return;
    }

    const parts = deviceQuery.trim().split(/\s+/);
    const firstWord = parts[0];

    // Only show ghost when typing the first word (no space yet, or just started)
    // If user already has a space, they're typing model - don't override
    const isTypingFirstWord = !deviceQuery.includes(" ");

    if (!isTypingFirstWord) {
      // Already moved to model — keep matchedBrand but clear ghost
      setBrandGhostSuffix("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      const result = await searchBrands(firstWord);
      if (result.success && result.data && result.data.length > 0) {
        // Find brand that starts with what user typed (case-insensitive)
        const startMatch = result.data.find((b) =>
          b.name.toLowerCase().startsWith(firstWord.toLowerCase())
        );

        if (startMatch) {
          // Ghost suffix = the remaining characters after what user typed
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
  }, [deviceQuery, selectedDevice]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDeviceQuery("");
      setDeviceResults([]);
      setSelectedDevice(null);
      setError(null);
      setBrandGhostSuffix("");
      setMatchedBrand(null);
      setPattern([]);
      setShowPatternLock(false);
      setPatternError(false);
      setIsEditMode(false);
      setCustomerName("");
      setNoWa("");
      setComplaint("");
      setImei("");
      setPasswordPatternText("");
    }
  }, [open]);

  // Handle pattern completion
  const handlePatternComplete = useCallback((newPattern: number[]) => {
    setPattern(newPattern);
    setPatternError(false);
  }, []);

  // Clear pattern
  const clearPattern = useCallback(() => {
    setPattern([]);
    setPatternError(false);
  }, []);

  // Convert pattern array to string for storage
  const patternToString = useCallback((p: number[]) => {
    return p.length > 0 ? p.join("-") : "";
  }, []);

  function handleDeviceSelect(device: HpCatalogOption) {
    setSelectedDevice(device);
    setDeviceQuery(`${device.brandName} ${device.modelName}`);
    setShowDropdown(false);
    setBrandGhostSuffix("");
  }

  // Accept brand ghost suggestion on Tab or ArrowRight at end
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Tab" || e.key === "ArrowRight") && brandGhostSuffix) {
      e.preventDefault();
      // Complete the brand + add a trailing space so user can type model
      const completed = `${matchedBrand} `;
      setDeviceQuery(completed);
      setBrandGhostSuffix("");
      // Move cursor to end
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

    // Parse brand and model from input
    // Format: "Brand Model" or just "Model"
    const parts = deviceQuery.trim().split(/\s+/);
    let brandName = "";
    let modelName = "";

    if (parts.length >= 2) {
      // Use matched brand if available, otherwise use first word
      brandName = matchedBrand || parts[0];
      modelName = parts.slice(1).join(" ");
    } else if (matchedBrand) {
      brandName = matchedBrand;
      modelName = parts[0];
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

    // Get password pattern value - from state (pattern lock) or text input
    let passwordPatternValue = passwordPatternText;
    if (showPatternLock && pattern.length > 0) {
      passwordPatternValue = patternToString(pattern);
    }

    let result;
    
    if (isEditMode && editData) {
      // Update existing service
      result = await updateService(editData.id, {
        hpCatalogId: selectedDevice.id,
        customerName: customerName || undefined,
        noWa: noWa,
        complaint: complaint,
        passwordPattern: passwordPatternValue || undefined,
        imei: imei || undefined,
      });
    } else {
      // Create new service - use form data for new service
      result = await createService({
        hpCatalogId: selectedDevice.id,
        customerName: (formData.get("customerName") as string) || undefined,
        noWa: formData.get("noWa") as string,
        complaint: formData.get("complaint") as string,
        passwordPattern:
          (formData.get("passwordPattern") as string) || undefined,
        imei: (formData.get("imei") as string) || undefined,
      });
    }

    setIsLoading(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.error || "Failed to " + (isEditMode ? "update" : "create") + " service");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditMode ? "Edit Service Ticket" : "New Service Ticket"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the service ticket details below." 
              : "Create a new service ticket by filling in the details below."}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6">
          {/* Device Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="device" className="text-base font-medium">
                Device
              </Label>
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              {/* Ghost text overlay — sits behind the input */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center rounded-md border border-transparent px-3 text-sm"
              >
                {/* Invisible spacer matching typed text to push ghost into position */}
                <span className="invisible whitespace-pre">{deviceQuery}</span>
                {brandGhostSuffix && (
                  <>
                    <span className="text-muted-foreground/50 select-none">
                      {brandGhostSuffix}
                    </span>
                    {/* Inline Tab key badge right after ghost suffix */}
                    <span className="ml-1.5 inline-flex items-center rounded border border-muted-foreground/30 bg-muted px-1 py-px font-mono text-[10px] text-muted-foreground/60 select-none leading-none">
                      Tab
                    </span>
                  </>
                )}
              </div>

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
                onKeyDown={handleKeyDown}
                placeholder="Search or type new device..."
                disabled={isLoading || isCreatingDevice}
                autoComplete="off"
                className={cn(
                  "bg-transparent border border-input shadow focus-visible:ring-1 focus-visible:ring-ring w-full",
                  selectedDevice && "border-green-500/50 bg-green-500/5"
                )}
              />

              {/* Selected device indicator */}
              {selectedDevice && !showDropdown && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {selectedDevice.brandName} {selectedDevice.modelName}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice(null);
                      setDeviceQuery("");
                      inputRef.current?.focus();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Ghost hint label */}
              {brandGhostSuffix && !showDropdown && !selectedDevice && (
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

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto">
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
          </div>

          {/* Customer Information Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">Customer Info</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm">
                  Customer Name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="Name (optional)"
                  disabled={isLoading}
                  value={isEditMode ? customerName : (editData?.customerName || "")}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="noWa" className="text-sm">
                    WhatsApp
                  </Label>
                  <Badge variant="secondary" className="text-[10px] px-1">
                    Required
                  </Badge>
                </div>
                <Input
                  id="noWa"
                  name="noWa"
                  placeholder="08123456789"
                  required
                  disabled={isLoading}
                  value={isEditMode ? noWa : (editData?.noWa || "")}
                  onChange={(e) => setNoWa(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium">Service Details</span>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="complaint" className="text-sm">
                    Complaint
                  </Label>
                  <Badge variant="secondary" className="text-[10px] px-1">
                    Required
                  </Badge>
                </div>
                <textarea
                  id="complaint"
                  name="complaint"
                  placeholder="Describe the issue with the device..."
                  required
                  disabled={isLoading}
                  rows={3}
                  value={isEditMode ? complaint : (editData?.complaint || "")}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="flex min-h-[80px] rounded-3xl w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              {/* Password / Pattern Lock - Full width */}
              <div className="space-y-2">
                <Label className="text-sm">
                  Password / Pattern Lock
                </Label>
                
                {/* Pattern lock toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!showPatternLock ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPatternLock(false)}
                    disabled={isLoading}
                  >
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={showPatternLock ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPatternLock(true)}
                    disabled={isLoading}
                  >
                    Pattern
                  </Button>
                </div>

                {/* Text input for password */}
                {!showPatternLock && (
                  <Input
                    id="passwordPattern"
                    name="passwordPattern"
                    placeholder="Device unlock code (PIN, password)"
                    disabled={isLoading}
                    value={isEditMode ? passwordPatternText : (editData?.passwordPattern || "")}
                    onChange={(e) => setPasswordPatternText(e.target.value)}
                  />
                )}

                {/* Pattern lock component */}
                {showPatternLock && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center p-3 bg-muted/30 rounded-lg border">
                      <PatternLock
                        width={300}
                        height={300}
                        error={patternError}
                        autoReset={false}
                        onPatternComplete={handlePatternComplete}
                        onPatternChange={(p) => {
                          if (p.length > 0) setPatternError(false);
                        }}
                      />
                    </div>
                    
                    {/* Pattern display and controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {pattern.length > 0 && (
                          <Badge variant="secondary" className="font-mono">
                            {pattern.join(" → ")}
                          </Badge>
                        )}
                        {pattern.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            Draw a pattern above
                          </span>
                        )}
                      </div>
                      {pattern.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearPattern}
                          disabled={isLoading}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Hidden input to submit pattern as string */}
                    <input
                      type="hidden"
                      name="passwordPattern"
                      value={patternToString(pattern)}
                    />
                  </div>
                )}
              </div>

              {/* IMEI - Separate row */}
              <div className="space-y-2">
                <Label htmlFor="imei" className="text-sm">
                  IMEI
                </Label>
                <Input
                  id="imei"
                  name="imei"
                  placeholder="Device IMEI number"
                  disabled={isLoading}
                  value={isEditMode ? imei : (editData?.imei || "")}
                  onChange={(e) => setImei(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isCreatingDevice}>
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Ticket" : "Create Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
