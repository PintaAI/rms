import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/rbac";
import { getServiceList, type ServiceListItem } from "@/actions";
import { StaffServicesOverview } from "@/components/staff/staff-services-overview";
import type { ServiceTableItem } from "@/components/dashboard/service-table";

function mapServiceToTableItem(service: ServiceListItem): ServiceTableItem {
  return {
    id: service.id,
    hpCatalogId: service.hpCatalog.id,
    customerName: service.customerName,
    noWa: service.noWa,
    complaint: service.complaint,
    note: service.note,
    status: service.status,
    checkinAt: service.checkinAt,
    doneAt: service.doneAt,
    checkoutAt: service.checkoutAt,
    passwordPattern: service.passwordPattern,
    imei: service.imei,
    hpCatalog: {
      modelName: service.hpCatalog.modelName,
      brand: { name: service.hpCatalog.brand.name },
    },
    technician: service.technician,
    invoice: service.invoice,
    createdBy: service.createdBy,
  };
}

export default async function StaffServicesPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth");
  }

  if (user.tokoIds.length === 0) {
    redirect("/auth");
  }

  const tokoId = user.tokoIds[0];
  const tokoName = "Your Store";

  const result = await getServiceList(tokoId, undefined, 1, 100, ["received", "repairing"]);

  const initialServices: ServiceTableItem[] = result.success && result.data
    ? result.data.data.map(mapServiceToTableItem)
    : [];

  const initialStats = {
    received: initialServices.filter((s) => s.status === "received").length,
    repairing: initialServices.filter((s) => s.status === "repairing").length,
  };

  const tokoResult = await (async () => {
    const prisma = (await import("@/lib/prisma")).default;
    return prisma.toko.findUnique({
      where: { id: tokoId },
      select: { name: true },
    });
  })();

  const actualTokoName = tokoResult?.name || tokoName;

  return (
    <StaffServicesOverview
      initialServices={initialServices}
      initialStats={initialStats}
      tokoId={tokoId}
      tokoName={actualTokoName}
    />
  );
}