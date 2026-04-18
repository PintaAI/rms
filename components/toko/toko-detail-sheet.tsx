"use client";

/**
 * TokoDetailSheet - Sheet dialog for creating/updating toko (store)
 *
 * OPTIMISTIC UI ARCHITECTURE (follows dev-docs/optimistic-ui-guide.md):
 *
 * This form supports optimistic UI updates via callbacks:
 *
 * CREATE:
 * - onOptimisticCreate(tempToko): Called BEFORE server request
 * - onSuccess(realToko?): Called AFTER server success
 * - onRevertCreate(): Called on failure to signal revert needed
 *
 * UPDATE:
 * - onOptimisticUpdate(updatedToko): Called BEFORE server request
 * - onSuccess(realToko?): Called AFTER server success
 * - onRevertUpdate(): Called on failure to signal revert needed
 *
 * The parent component should:
 * - Track pendingMutationsRef counter
 * - Apply optimistic state on onOptimisticCreate/onOptimisticUpdate
 * - Decrement counter and refresh on onSuccess
 * - Revert state on onRevertCreate/onRevertUpdate
 */

import { useEffect, useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTokoById, createToko, updateToko, deleteToko } from "@/actions/toko";
import { AddUserForm } from "@/components/add-user-form";
import { UserList } from "@/components/user-list";
import { RiStore2Line, RiTeamLine, RiToolsLine, RiLoader4Line, RiDeleteBinLine, RiImageLine } from "@remixicon/react";
import type { Toko } from "@/actions/toko";

const LOGO_MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface TokoDetailSheetProps {
  tokoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticCreate?: (tempToko: Toko) => void;
  onOptimisticUpdate?: (updatedToko: Toko) => void;
  onRevertCreate?: () => void;
  onRevertUpdate?: () => void;
  onSuccess?: (toko?: Toko) => void;
  onDelete?: (tokoId: string) => void;
}

export function TokoDetailSheet({
  tokoId,
  open,
  onOpenChange,
  onOptimisticCreate,
  onOptimisticUpdate,
  onRevertCreate,
  onRevertUpdate,
  onSuccess,
  onDelete,
}: TokoDetailSheetProps) {
  const [toko, setToko] = useState<Toko | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tokoRef = useRef(toko);
  tokoRef.current = toko;

  const isCreateMode = !tokoId;
  const isEditMode = tokoId && toko;

  useEffect(() => {
    async function fetchToko() {
      if (tokoId && open) {
        setIsLoading(true);
        const result = await getTokoById(tokoId);
        if (result.success && result.data) {
          setToko(result.data);
          setName(result.data.name);
          setAddress(result.data.address || "");
          setPhone(result.data.phone || "");
          setLogoUrl(result.data.logoUrl || null);
          setLogoPreview(result.data.logoUrl || null);
        }
        setIsLoading(false);
      } else if (open && !tokoId) {
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

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > LOGO_MAX_SIZE) {
      setError(`File size exceeds the limit of ${LOGO_MAX_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setIsUploadingLogo(true);
    setError(null);

    try {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    if (logoUrl && logoUrl.startsWith("http")) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: logoUrl }),
        });
      } catch (err) {
        console.error("Failed to delete logo:", err);
      }
    }

    setLogoUrl(null);
    setLogoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const optimisticToko: Toko = {
      id: tokoRef.current?.id || `temp-${Date.now()}`,
      name,
      address: address || null,
      phone: phone || null,
      logoUrl: logoUrl || null,
      status: tokoRef.current?.status || "active",
      createdAt: tokoRef.current?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (!tokoRef.current && onOptimisticCreate) {
      onOptimisticCreate(optimisticToko);
      onOpenChange(false);
    }

    if (tokoRef.current && onOptimisticUpdate) {
      onOptimisticUpdate(optimisticToko);
      onOpenChange(false);
    }

    if (!onOptimisticCreate && !onOptimisticUpdate) {
      onSuccess?.(optimisticToko);
      onOpenChange(false);
    }

    let result;
    if (isEditMode && tokoRef.current) {
      result = await updateToko({
        id: tokoRef.current.id,
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

    if (!result.success) {
      setError(result.error || `Failed to ${isEditMode ? "update" : "create"} toko`);
      if (!tokoRef.current && onRevertCreate) {
        onRevertCreate();
      }
      if (tokoRef.current && onRevertUpdate) {
        onRevertUpdate();
      }
      if (!onRevertCreate && !onRevertUpdate) {
        onSuccess?.();
      }
    } else if (result.data) {
      onSuccess?.(result.data);
    }
  }

  async function handleDelete() {
    if (!tokoRef.current) return;
    
    setIsDeleting(true);
    setError(null);

    const result = await deleteToko(tokoRef.current.id);

    if (!result.success) {
      setError(result.error || "Failed to delete toko");
      setIsDeleting(false);
    } else {
      onDelete?.(tokoRef.current.id);
      onOpenChange(false);
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

              <TabsContent value="details" className="mt-4 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                      {error}
                    </div>
                  )}

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
                          disabled={isUploadingLogo}
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
                      disabled={isUploadingLogo}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address (optional)"
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
                    />
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    {isEditMode && toko && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              type="button"
                              variant="destructive"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <RiLoader4Line className="w-4 h-4 animate-spin" />
                              ) : (
                                <RiDeleteBinLine className="w-4 h-4" />
                              )}
                              Delete
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Toko</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{toko.name}" and all associated data including services, spareparts, and user assignments. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {isEditMode ? "Update" : "Create"}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {isEditMode && toko && (
                <TabsContent value="staff" className="mt-2 space-y-2">
                  <AddUserForm tokoId={toko.id} role="staff" />
                  <UserList tokoId={toko.id} role="staff" />
                </TabsContent>
              )}

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