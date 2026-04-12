"use client";

import { useEffect, useState } from "react";
import { useToko } from "@/components/toko/toko-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  RiUserLine,
  RiUserSmileLine,
  RiDeleteBinLine,
  RiMailLine,
  RiStore2Line,
} from "@remixicon/react";

// Delete Confirmation Dialog
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

export default function KaryawanPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const [staff, setStaff] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchData() {
    if (!selectedToko) {
      setStaff([]);
      setTechnicians([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUsersByToko(selectedToko.id);
      if (result.success && result.data) {
        setStaff(result.data.staff);
        setTechnicians(result.data.technicians);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [selectedToko]);

  async function handleDelete() {
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
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  function openDeleteDialog(id: string, name: string) {
    setDeleteTarget({ id, name });
    setDeleteDialogOpen(true);
  }

  // Loading state
  if (tokoLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // No toko selected
  if (!selectedToko) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <RiStore2Line className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Toko Selected</h2>
        <p className="text-muted-foreground mt-2">
          Please select a toko from the sidebar to manage employees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{selectedToko.name} Employees</h1>
        <p className="text-muted-foreground">
          View and manage staff and technicians for this toko
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff" className="gap-2">
            <RiUserLine className="h-4 w-4" />
            Staff ({staff.length})
          </TabsTrigger>
          <TabsTrigger value="technicians" className="gap-2">
            <RiUserSmileLine className="h-4 w-4" />
            Technicians ({technicians.length})
          </TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff</CardTitle>
              <CardDescription>
                Staff members who receive service orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff found for this toko.
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
                    {staff.map((user) => (
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
                          <Badge variant="secondary">Staff</Badge>
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
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle>Technicians</CardTitle>
              <CardDescription>
                Technicians who perform repairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {technicians.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No technicians found for this toko.
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
                    {technicians.map((user) => (
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
                          <Badge>Technician</Badge>
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
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
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