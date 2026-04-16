"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { searchDevices, createDevice } from "@/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiLoader4Line, RiSearchLine, RiAddLine, RiCloseLine, RiCheckLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

export interface HpCatalogOption {
  id: string;
  modelName: string;
  brandName: string;
}

interface MultiDeviceInputProps {
  value: HpCatalogOption[];
  onChange: (devices: HpCatalogOption[]) => void;
  disabled?: boolean;
}

export function MultiDeviceInput({
  value,
  onChange,
  disabled = false,
}: MultiDeviceInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HpCatalogOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    const result = await searchDevices(searchQuery);
    if (result.success && result.data) {
      const filtered = result.data.filter(
        (d) => !value.some((v) => v.id === d.id)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
    setIsSearching(false);
  }, [value]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, doSearch]);

  const handleSelect = useCallback((device: HpCatalogOption) => {
    if (value.some((v) => v.id === device.id)) {
      setShowDropdown(false);
      return;
    }
    onChange([...value, device]);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }, [value, onChange]);

  const handleRemove = useCallback((deviceId: string) => {
    onChange(value.filter((d) => d.id !== deviceId));
  }, [value, onChange]);

  const handleCreate = useCallback(async () => {
    if (!query.trim()) return;

    setIsCreating(true);
    const parts = query.trim().split(/\s+/);
    const brandName = parts.length >= 2 ? parts[0] : "Unknown";
    const modelName = parts.length >= 2 ? parts.slice(1).join(" ") : parts[0];

    const result = await createDevice({ brandName, modelName });
    setIsCreating(false);

    if (result.success && result.data) {
      if (value.some((v) => v.id === result.data!.id)) {
        setQuery("");
        setShowDropdown(false);
        return;
      }
      handleSelect(result.data);
    }
  }, [query, value, handleSelect]);

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
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((device) => (
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
                onClick={() => handleRemove(device.id)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <RiCloseLine className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search or type new device..."
          disabled={disabled || isCreating}
          autoComplete="off"
          className={cn(
            "w-full",
            value.length > 0 && "border-green-500/50 bg-green-500/5"
          )}
        />

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
                      Create &quot;{displayQuery}&quot;
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}