"use client";

import { useState } from "react";
import { createToko } from "@/actions/toko";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiAddLine } from "@remixicon/react";

export function TokoForm() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await createToko({
      name: formData.get("name") as string,
      address: formData.get("address") as string || undefined,
      phone: formData.get("phone") as string || undefined,
    });

    setIsLoading(false);

    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error || "Failed to create toko");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="default" />}>
        <RiAddLine />
        Add Toko
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Toko</DialogTitle>
          <DialogDescription>
            Add a new toko to your organization. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter toko name"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="Enter address (optional)"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number (optional)"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="outline" />} disabled={isLoading}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}