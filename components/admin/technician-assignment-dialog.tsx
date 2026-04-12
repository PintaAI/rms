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
import { getTechniciansByToko, assignTechnicianToService } from "@/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { RiUserLine, RiCloseLine } from "@remixicon/react";

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
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);
      // Set current technician as selected if exists
      setSelectedTechnician(currentTechnician?.id || "");

      getTechniciansByToko(tokoId).then((result) => {
        if (result.success && result.data) {
          setTechnicians(result.data);
        } else {
          setError(result.error || "Failed to load technicians");
        }
        setIsLoading(false);
      });
    }
  }, [open, tokoId, currentTechnician]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await assignTechnicianToService(
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

  const handleUnassign = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await assignTechnicianToService(serviceId, null);

    if (result.success) {
      onAssignmentChange?.();
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to unassign technician");
    }

    setIsSubmitting(false);
  };

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
          <div className="py-8 text-center text-muted-foreground">
            Loading technicians...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">{error}</div>
        ) : technicians.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <RiUserLine className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No technicians available for this toko.</p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <Select
                value={selectedTechnician}
                onValueChange={setSelectedTechnician}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name} ({tech.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentTechnician && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    Current Technician
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="default">{currentTechnician.name}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={isSubmitting}
                      className="h-6 text-xs"
                    >
                      <RiCloseLine className="h-3 w-3 mr-1" />
                      Unassign
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isSubmitting || !selectedTechnician}
              >
                {isSubmitting ? "Assigning..." : "Assign Technician"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
