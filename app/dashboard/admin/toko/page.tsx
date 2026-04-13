import { TokoListClient } from "@/components/toko/toko-list-client";
import { getAllToko } from "@/actions/toko";

export default async function KelolaTokoPage() {
  const result = await getAllToko();
  const tokoList = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kelola Toko</h1>
        <p className="text-muted-foreground">Manage all your stores.</p>
      </div>
      <TokoListClient tokoList={tokoList} />
    </div>
  );
}
