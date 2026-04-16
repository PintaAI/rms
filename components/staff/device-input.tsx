"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { searchDevices, createDevice } from "@/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RiCheckLine,
  RiLoader4Line,
  RiSearchLine,
  RiAddLine,
  RiCloseLine,
  RiAlertLine,
} from "@remixicon/react";
import { cn } from "@/lib/utils";

export interface HpCatalogOption {
  id: string;
  modelName: string;
  brandName: string;
}

interface DeviceInputProps {
  value: HpCatalogOption | null;
  onChange: (device: HpCatalogOption | null) => void;
  disabled?: boolean;
  error?: string | null;
}

export function DeviceInput({
  value,
  onChange,
  disabled = false,
  error,
}: DeviceInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HpCatalogOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSelected = useMemo(() => {
    return value && `${value.brandName} ${value.modelName}` === query;
  }, [value, query]);

  useEffect(() => {
    if (value) {
      setQuery(`${value.brandName} ${value.modelName}`);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || isSelected) {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const result = await searchDevices(searchQuery);
      setResults(result.success && result.data ? result.data : []);
      setIsSearching(false);
    }, 300);
  }, [isSelected]);

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debouncedSearch]);

  const handleSelect = useCallback((device: HpCatalogOption) => {
    onChange(device);
    setQuery(`${device.brandName} ${device.modelName}`);
    setShowDropdown(false);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!query.trim()) return;

    setIsCreating(true);
    const parts = query.trim().split(/\s+/);
    const brandName = parts.length >= 2 ? parts[0] : "Unknown";
    const modelName = parts.length >= 2 ? parts.slice(1).join(" ") : parts[0];

    const result = await createDevice({ brandName, modelName });
    setIsCreating(false);

    if (result.success && result.data) {
      handleSelect(result.data);
    }
  }, [query, handleSelect]);

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(null);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    if (query.trim() && !isSelected) {
      setShowDropdown(true);
    }
  }, [query, isSelected]);

  const parseDeviceName = useCallback((deviceQuery: string) => {
    const parts = deviceQuery.trim().split(/\s+/);
    if (parts.length >= 2) {
      return { brand: parts[0], model: parts.slice(1).join(" ") };
    }
    return { brand: "Unknown", model: parts[0] || deviceQuery };
  }, []);

  const displayQuery = useMemo(() => {
    if (!query.trim()) return query;
    const parsed = parseDeviceName(query);
    return `${parsed.brand} ${parsed.model}`;
  }, [query, parseDeviceName]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="device" className="text-base font-medium">
          Device
        </Label>
        <Badge variant="secondary" className="text-xs">Required</Badge>
      </div>

      <div className="relative" ref={dropdownRef}>
        <Input
          ref={inputRef}
          id="device"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Search or type new device..."
          disabled={disabled || isCreating}
          autoComplete="off"
          className={cn(
            "w-full",
            value && "border-green-500/50 bg-green-500/5"
          )}
        />

        {value && !showDropdown && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <RiCheckLine className="w-3 h-3 mr-1" />
              {value.brandName} {value.modelName}
            </Badge>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Change
            </button>
          </div>
        )}

        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto">
            {isSearching ? (
              <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                <RiLoader4Line className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Existing Devices
                </div>
                {results.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors flex items-center justify-between group"
                    onClick={() => handleSelect(device)}
                  >
                    <span>
                      <span className="font-medium">{device.brandName}</span>
                      <span className="text-muted-foreground ml-1">{device.modelName}</span>
                    </span>
                    <RiCheckLine className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <RiSearchLine className="w-4 h-4" />
                  No existing device found
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <RiAddLine className="w-4 h-4 mr-2" />
                      Create "{displayQuery}"
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
          <RiAlertLine className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}