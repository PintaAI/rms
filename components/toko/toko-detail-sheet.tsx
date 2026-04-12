"use client";

import { useEffect, useState } from "react";
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
import { RiStore2Line, RiTeamLine, RiToolsLine, RiLoader4Line, RiAddLine } from "@remixicon/react";
import type { Toko } from "@/actions/toko";

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
        }
        setIsLoading(false);
      } else if (open && !tokoId) {
        // Create mode - reset form
        setToko(null);
        setName("");
        setAddress("");
        setPhone("");
        setError(null);
      }
    }
    fetchToko();
  }, [tokoId, open]);

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
      });
    } else {
      result = await createToko({
        name,
        address: address || undefined,
        phone: phone || undefined,
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

            <Tabs defaultValue={isCreateMode ? "details" : "staff"} className="w-full">
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