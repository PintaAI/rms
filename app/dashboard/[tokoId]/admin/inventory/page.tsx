import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/rbac";
import { getSpareparts, getServicePricelists, type SparepartWithCompatibilities } from "@/actions/inventory";
import { InventoryOverview } from "@/components/admin/inventory-overview";

interface InventoryPricelist {
  id: string;
  title: string;
  defaultPrice: number;
}

interface InventoryPageProps {
  params: Promise<{ tokoId: string }>;
}

export default async function AdminInventoryPage({ params }: InventoryPageProps) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth");
  }

  const { tokoId } = await params;

  if (!user.tokoIds.includes(tokoId)) {
    notFound();
  }

  const prisma = (await import("@/lib/prisma")).default;
  const toko = await prisma.toko.findUnique({
    where: { id: tokoId },
    select: { name: true },
  });

  const [sparepartsResult, pricelistsResult] = await Promise.all([
    getSpareparts(tokoId),
    getServicePricelists(tokoId),
  ]);

  const initialSpareparts: SparepartWithCompatibilities[] = sparepartsResult.success && sparepartsResult.data
    ? sparepartsResult.data
    : [];

  const initialPricelists: InventoryPricelist[] = pricelistsResult.success && pricelistsResult.data
    ? pricelistsResult.data.map((p) => ({
        id: p.id,
        title: p.title,
        defaultPrice: p.defaultPrice,
      }))
    : [];

  return (
    <InventoryOverview
      initialSpareparts={initialSpareparts}
      initialPricelists={initialPricelists}
      tokoId={tokoId}
      tokoName={toko?.name || "Unknown Store"}
    />
  );
}