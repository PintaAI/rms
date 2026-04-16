"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getTechniciansByToko, assignTechnician } from "@/actions";
import { Label } from "@/components/ui/label";
import {
  RiUserLine,
  RiCloseLine,
  RiLoader4Line,
  RiRefreshLine,
  RiUserAddLine,
} from "@remixicon/react";

interface Technician {
  id: string;
  name: string;
  email: string;
}

interface TechnicianAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  tokoId: string;
  currentTechnician?: { id: string; name: string } | null;
  onAssignmentChange?: () => void;
}

export function TechnicianAssignmentDialog({
  open,
  onOpenChange,
  serviceId,
  tokoId,
  currentTechnician,
  onAssignmentChange,
}: TechnicianAssignmentDialogProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTechnicians = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTechniciansByToko(tokoId);
      if (result.success && result.data) {
        setTechnicians(result.data);
      } else {
        setError(result.error || "Failed to load technicians");
      }
    } catch {
      setError("Failed to load technicians");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedTechnician(currentTechnician?.id || "");
      loadTechnicians();
    }
  }, [open, tokoId, currentTechnician?.id]);

  const handleAssign = async () => {
    if (!selectedTechnician && selectedTechnician !== "") return;

    setIsSubmitting(true);
    setError(null);

    const result = await assignTechnician(
      serviceId,
      selectedTechnician || null
    );

    if (result.success) {
      onAssignmentChange?.();
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to assign technician");
    }

    setIsSubmitting(false);
  };

  const hasChanges = currentTechnician
    ? currentTechnician.id !== selectedTechnician
    : selectedTechnician !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to handle this service. The technician will be
            notified and the service status will be updated.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading technicians...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadTechnicians}>
              <RiRefreshLine className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        ) : technicians.length === 0 && !currentTechnician ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <RiUserLine className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No technicians available</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add technicians to this store to enable assignment
            </p>
          </div>
        ) : (
          <>
            {currentTechnician && (
              <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Currently Assigned
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <RiUserLine className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{currentTechnician.name}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="technician-select">
                {currentTechnician ? "Reassign to" : "Assign to"}
              </Label>
              <Select
                value={selectedTechnician}
                onValueChange={(value) => setSelectedTechnician(value || "")}
              >
                <SelectTrigger id="technician-select" className="w-full">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {currentTechnician && (
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <RiCloseLine className="h-4 w-4 text-muted-foreground" />
                        <span>Unassign</span>
                      </div>
                    </SelectItem>
                  )}
                  {currentTechnician && technicians.length > 0 && (
                    <div className="h-px bg-border my-1" />
                  )}
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex items-center gap-2">
                        <RiUserLine className="h-4 w-4 text-muted-foreground" />
                        <span>{tech.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {tech.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {technicians.length} technician{technicians.length !== 1 ? "s" : ""} available
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? (
                  <>
                    <RiLoader4Line className="h-4 w-4 mr-1 animate-spin" />
                    {currentTechnician ? "Reassigning..." : "Assigning..."}
                  </>
                ) : (
                  <>
                    <RiUserAddLine className="h-4 w-4 mr-1" />
                    {currentTechnician
                      ? selectedTechnician === ""
                        ? "Unassign Technician"
                        : "Reassign Technician"
                      : "Assign Technician"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
