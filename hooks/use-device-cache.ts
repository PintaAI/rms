"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDeviceList } from "@/actions";
import type { HpCatalogOption } from "@/components/staff/device-input";

const CACHE_KEY = "hp_catalog_cache";
const CACHE_TIMESTAMP_KEY = "hp_catalog_timestamp";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDeviceCache() {
  const [devices, setDevices] = useState<HpCatalogOption[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadFromCache = useCallback((): HpCatalogOption[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      console.log("[DeviceCache] Loading from cache:", { cached: !!cached, timestamp });
      
      if (cached && timestamp) {
        const parsedDevices = JSON.parse(cached) as HpCatalogOption[];
        const parsedTimestamp = parseInt(timestamp, 10);
        const age = Date.now() - parsedTimestamp;
        const isValid = age < CACHE_DURATION_MS;
        
        console.log("[DeviceCache] Cache age:", `${Math.round(age / 1000 / 60)}min`, "valid:", isValid, "devices:", parsedDevices.length);
        
        if (isValid) {
          console.log("[DeviceCache] Using cached devices");
          return parsedDevices;
        }
        console.log("[DeviceCache] Cache expired, will fetch from API");
      }
    } catch (error) {
      console.error("[DeviceCache] Error reading from cache:", error);
    }
    return null;
  }, []);

  const saveToCache = useCallback((deviceList: HpCatalogOption[]) => {
    try {
      console.log("[DeviceCache] Saving to cache:", deviceList.length, "devices");
      localStorage.setItem(CACHE_KEY, JSON.stringify(deviceList));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log("[DeviceCache] Cache saved successfully");
    } catch (error) {
      console.error("[DeviceCache] Error saving to cache:", error);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log("[DeviceCache] Already loaded, skipping");
      return;
    }
    
    console.log("[DeviceCache] Initializing...");
    
    const cached = loadFromCache();
    if (cached) {
      setDevices(cached);
      setIsInitialized(true);
      hasLoadedRef.current = true;
      console.log("[DeviceCache] Initialized from cache");
      return;
    }

    console.log("[DeviceCache] Fetching from API...");
    getDeviceList().then((result) => {
      console.log("[DeviceCache] API result:", result.success, result.data?.length);
      if (result.success && result.data) {
        setDevices(result.data);
        saveToCache(result.data);
        setIsInitialized(true);
        hasLoadedRef.current = true;
        console.log("[DeviceCache] Initialized from API");
      }
    });
  }, [loadFromCache, saveToCache]);

  const searchDevices = useCallback((query: string): HpCatalogOption[] => {
    console.log("[DeviceCache] Searching locally:", query, "devices available:", devices.length);
    
    if (!query.trim()) {
      console.log("[DeviceCache] Empty query, returning first 20 devices");
      return devices.slice(0, 20);
    }

    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);
    const firstWord = queryWords[0];
    const restWords = queryWords.slice(1).join(" ");

    const filtered = devices.filter((device) => {
      const brandLower = device.brandName.toLowerCase();
      const modelLower = device.modelName.toLowerCase();
      const fullLower = `${brandLower} ${modelLower}`;

      if (fullLower.includes(queryLower)) return true;
      if (brandLower.includes(queryLower) || modelLower.includes(queryLower)) return true;
      
      if (queryWords.length >= 2) {
        if (brandLower.includes(firstWord) && modelLower.includes(restWords)) {
          return true;
        }
      }
      
      return false;
    });

    console.log("[DeviceCache] Filtered results:", filtered.length);
    return filtered.slice(0, 20);
  }, [devices]);

  const refreshCache = useCallback(async () => {
    const result = await getDeviceList();
    if (result.success && result.data) {
      setDevices(result.data);
      saveToCache(result.data);
    }
    return result;
  }, [saveToCache]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      setDevices([]);
      hasLoadedRef.current = false;
      setIsInitialized(false);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  return {
    devices,
    isInitialized,
    searchDevices,
    refreshCache,
    clearCache,
  };
}