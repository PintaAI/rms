import { getAllToko } from "@/actions/toko";
import { TokoListClient } from "@/components/toko/toko-list-client";

export default async function DashboardPage() {
  const result = await getAllToko();
  const tokoList = result.success ? result.data : [];

  return (
    <div className="container mx-auto">
      <div className="flex-col items-center">
        <h1 className="text-2xl font-bold">Toko List</h1>
        <p className="text-sm text-muted-foreground">
          Manage your toko and view details.
        </p>
      </div>

      {!result.success && (
        <div className="text-destructive mb-4">
          Error: {result.error}
        </div>
      )}

      <TokoListClient tokoList={tokoList ?? []} />
    </div>
  );
}