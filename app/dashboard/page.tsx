import { getAllToko } from "@/actions/toko";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { TokoForm } from "@/components/toko-form";
import { TokoListClient } from "@/components/toko-list-client";
import { RiStore2Line } from "@remixicon/react";

export default async function DashboardPage() {
  const result = await getAllToko();
  const tokoList = result.success ? result.data : [];

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Toko List</h1>
        <TokoForm />
      </div>

      {!result.success && (
        <div className="text-destructive mb-4">
          Error: {result.error}
        </div>
      )}

      {tokoList && tokoList.length === 0 ? (
        <Empty className="border-2 border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiStore2Line />
            </EmptyMedia>
            <EmptyTitle>No Toko Found</EmptyTitle>
            <EmptyDescription>
              Get started by creating your first toko.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TokoListClient tokoList={tokoList!} />
      )}
    </div>
  );
}