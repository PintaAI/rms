"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getUsersByToko,
  removeUserFromToko,
  type User,
} from "@/actions/user";
import {
  RiDeleteBinLine,
  RiMailLine,
} from "@remixicon/react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Are you sure you want to remove <strong>{userName}</strong> from this toko? 
            This will also delete their account. This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AdminKaryawanClientProps {
  tokoId: string;
  initialUsers: User[];
}

export function AdminKaryawanClient({
  tokoId,
  initialUsers,
}: AdminKaryawanClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [error, setError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      const result = await getUsersByToko(tokoId);
      if (result.success && result.data) {
        setUsers([...result.data.staff, ...result.data.technicians]);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch {
      console.error("Error fetching users:");
      setError("Failed to load users");
    }
  }, [tokoId]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await removeUserFromToko(deleteTarget.id);
      if (result.success) {
        await fetchData();
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      } else {
        setError(result.error || "Failed to remove user");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-muted-foreground">
          View and manage staff and technicians ({users.length})
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employees found for this toko.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RiMailLine className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "technician" ? "default" : "secondary"}>
                        {user.role === "technician" ? "Technician" : "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(user.id, user.name)}
                      >
                        <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}