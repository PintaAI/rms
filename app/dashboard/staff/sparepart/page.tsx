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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getSpareparts,
  deleteSparepart,
  type SparepartWithCompatibilities,
} from "@/actions/inventory";
import { SparepartFormDialog } from "@/components/admin/sparepart-form-dialog";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiToolsLine,
  RiRefreshLine,
} from "@remixicon/react";

// Format currency (Indonesian Rupiah)
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Delete Confirmation Dialog
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Apakah Anda yakin ingin menghapus <strong>{title}</strong>? Tindakan
            ini tidak dapat dibatalkan.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffSparepartPage() {
  const { selectedToko, isLoading: tokoLoading } = useToko();
  const [spareparts, setSpareparts] = useState<SparepartWithCompatibilities[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [sparepartDialogOpen, setSparepartDialogOpen] = useState(false);
  const [editingSparepart, setEditingSparepart] =
    useState<SparepartWithCompatibilities | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchData() {
    if (!selectedToko) {
      setSpareparts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSpareparts(selectedToko.id);

      if (result.success && result.data) {
        setSpareparts(result.data);
      } else {
        setError(result.error || "Gagal memuat data sparepart");
      }
    } catch (err) {
      console.error("Error fetching spareparts:", err);
      setError("Gagal memuat data sparepart");
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
      const result = await deleteSparepart(deleteTarget.id);

      if (result.success) {
        await fetchData();
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      } else {
        setError(result.error || "Gagal menghapus sparepart");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  }

  function openSparepartDialog(sparepart?: SparepartWithCompatibilities) {
    setEditingSparepart(sparepart || null);
    setSparepartDialogOpen(true);
  }

  function openDeleteDialog(id: string, title: string) {
    setDeleteTarget({ id, title });
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
        <RiToolsLine className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Toko Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2">
          Anda belum ditugaskan ke toko manapun.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sparepart</h1>
          <p className="text-muted-foreground">
            Kelola sparepart untuk toko {selectedToko.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RiRefreshLine className="h-4 w-4" />
          </Button>
          <Button onClick={() => openSparepartDialog()}>
            <RiAddLine className="h-4 w-4 mr-2" />
            Tambah Sparepart
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      {/* Spareparts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiToolsLine className="h-5 w-5" />
            Daftar Sparepart ({spareparts.length})
          </CardTitle>
          <CardDescription>
            Sparepart yang tersedia untuk perbaikan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spareparts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada sparepart. Tambahkan sparepart pertama Anda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Harga Default</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Perangkat Kompatibel</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spareparts.map((sparepart) => (
                  <TableRow key={sparepart.id}>
                    <TableCell className="font-medium">
                      {sparepart.name}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(sparepart.defaultPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sparepart.isUniversal ? "default" : "secondary"}
                      >
                        {sparepart.isUniversal ? "Universal" : "Spesifik"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sparepart.isUniversal ? (
                        <span className="text-muted-foreground text-sm">
                          Semua perangkat
                        </span>
                      ) : sparepart.compatibilities.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sparepart.compatibilities.slice(0, 3).map((c) => (
                            <Badge
                              key={c.hpCatalogId}
                              variant="outline"
                              className="text-xs"
                            >
                              {c.hpCatalog.brand.name} {c.hpCatalog.modelName}
                            </Badge>
                          ))}
                          {sparepart.compatibilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sparepart.compatibilities.length - 3} lainnya
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Tidak ada
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openSparepartDialog(sparepart)}
                        >
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            openDeleteDialog(sparepart.id, sparepart.name)
                          }
                        >
                          <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SparepartFormDialog
        open={sparepartDialogOpen}
        onOpenChange={setSparepartDialogOpen}
        sparepart={editingSparepart}
        tokoId={selectedToko.id}
        onSuccess={fetchData}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
