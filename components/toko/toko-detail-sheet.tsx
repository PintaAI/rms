"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTokoById, createToko, updateToko } from "@/actions/toko";
import { AddUserForm } from "@/components/add-user-form";
import { UserList } from "@/components/user-list";
import { RiStore2Line, RiTeamLine, RiToolsLine, RiLoader4Line, RiDeleteBinLine, RiImageLine,} from "@remixicon/react";
import type { Toko } from "@/actions/toko";

// Logo size limit: 2MB
const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface TokoDetailSheetProps {
  tokoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TokoDetailSheet({ tokoId, open, onOpenChange, onSuccess }: TokoDetailSheetProps) {
  const [toko, setToko] = useState<Toko | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for create/edit mode
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreateMode = !tokoId;
  const isEditMode = tokoId && toko;

  useEffect(() => {
    async function fetchToko() {
      if (tokoId && open) {
        setIsLoading(true);
        const result = await getTokoById(tokoId);
        if (result.success && result.data) {
          setToko(result.data);
          // Pre-fill form
          setName(result.data.name);
          setAddress(result.data.address || "");
          setPhone(result.data.phone || "");
          setLogoUrl(result.data.logoUrl || null);
          setLogoPreview(result.data.logoUrl || null);
        }
        setIsLoading(false);
      } else if (open && !tokoId) {
        // Create mode - reset form
        setToko(null);
        setName("");
        setAddress("");
        setPhone("");
        setLogoUrl(null);
        setLogoPreview(null);
        setError(null);
      }
    }
    fetchToko();
  }, [tokoId, open]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    // Validate file size
    if (file.size > LOGO_MAX_SIZE) {
      setError(`File size exceeds the limit of ${LOGO_MAX_SIZE / 1024 / 1024}MB. Please upload a smaller image.`);
      return;
    }

    setIsUploadingLogo(true);
    setError(null);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

      // Upload to blob storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pathname", `logos/${Date.now()}-${file.name}`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload logo");
      }

      const result = await response.json();
      setLogoUrl(result.blob.url);
    } catch (err) {
      console.error("Logo upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    // Delete from blob storage if there's a stored URL
    if (logoUrl && logoUrl.startsWith("http")) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: logoUrl }),
        });
      } catch (err) {
        console.error("Failed to delete logo from blob storage:", err);
      }
    }
    
    // Clear local state
    setLogoUrl(null);
    setLogoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let result;
    if (isEditMode && toko) {
      result = await updateToko({
        id: toko.id,
        name,
        address: address || undefined,
        phone: phone || undefined,
        logoUrl: logoUrl || null,
      });
    } else {
      result = await createToko({
        name,
        address: address || undefined,
        phone: phone || undefined,
        logoUrl: logoUrl || undefined,
      });
    }

    setIsSaving(false);

    if (result.success) {
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError(result.error || `Failed to ${isEditMode ? "update" : "create"} toko`);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-4" showCloseButton={false}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RiLoader4Line className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <SheetHeader className="p-4">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <RiStore2Line className="w-5 h-5" />
                {isCreateMode ? "Create New Toko" : toko?.name}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {isCreateMode
                  ? "Add a new toko to your organization."
                  : "Manage toko details, staff and technicians."}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue={"details"} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex items-center">
                  <RiStore2Line className="w-4 h-4" />
                  Details
                </TabsTrigger>
                {!isCreateMode && (
                  <>
                    <TabsTrigger value="staff" className="flex items-center">
                      <RiTeamLine className="w-4 h-4" />
                      Staff
                    </TabsTrigger>
                    <TabsTrigger value="technician" className="flex items-center ">
                      <RiToolsLine className="w-4 h-4" />
                      Technicians
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
              
              {/* Details Tab - for both create and edit */}
              <TabsContent value="details" className="mt-4 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                      {error}
                    </div>
                  )}
                  
                  {/* Logo Upload - Top Center */}
                  <div className="space-y-2 flex flex-col items-center">
                    <Label className="font-bold">Logo</Label>
                    
                    {logoPreview ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className={`w-full h-full object-cover ${isUploadingLogo ? "opacity-50" : ""}`}
                        />
                        {isUploadingLogo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <RiLoader4Line className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          disabled={isSaving || isUploadingLogo}
                        >
                          <RiDeleteBinLine className="text-background w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingLogo ? (
                          <RiLoader4Line className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <RiImageLine className="w-8 h-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Upload Logo</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Max file size: 2MB. Supported formats: JPEG, PNG, WebP, GIF
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isSaving || isUploadingLogo}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter toko name"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address (optional)"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number (optional)"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : isEditMode ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Staff Tab - only for edit mode */}
              {isEditMode && toko && (
                <TabsContent value="staff" className="mt-2 space-y-2">
                  <AddUserForm tokoId={toko.id} role="staff" />
                  <UserList tokoId={toko.id} role="staff" />
                </TabsContent>
              )}

              {/* Technician Tab - only for edit mode */}
              {isEditMode && toko && (
                <TabsContent value="technician" className="mt-4 space-y-4">
                  <AddUserForm tokoId={toko.id} role="technician" />
                  <UserList tokoId={toko.id} role="technician" />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}