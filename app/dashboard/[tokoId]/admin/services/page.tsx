import { getAuthUser } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import { getServiceList, type ServiceListItem } from "@/actions";
import { AdminServicesClient, type ServiceTableItem } from "./services-client";

interface ServicesPageSearchParams {
  status?: string;
}

interface ServicesPageProps {
  params: Promise<{ tokoId: string }>;
  searchParams: Promise<ServicesPageSearchParams>;
}

export default async function AdminServicesPage({ params, searchParams }: ServicesPageProps) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const { tokoId } = await params;

  if (!user.tokoIds.includes(tokoId)) {
    notFound();
  }

  const search = await searchParams;
  const statusParam = search.status;
  const statusFilter: ("received" | "repairing")[] = 
    statusParam === "received" || statusParam === "repairing"
      ? [statusParam]
      : ["received", "repairing"];

  const result = await getServiceList(tokoId, undefined, 1, 200, statusFilter);

  const services: ServiceTableItem[] = result.success && result.data
    ? result.data.data.filter(
        (s: ServiceListItem) => s.status === "received" || s.status === "repairing"
      ) as ServiceTableItem[]
    : [];

  const allResult = await getServiceList(tokoId, undefined, 1, 200, ["received", "repairing"]);
  const allServices: ServiceTableItem[] = allResult.success && allResult.data
    ? allResult.data.data as ServiceTableItem[]
    : [];

  const stats = {
    received: allServices.filter((s) => s.status === "received").length,
    repairing: allServices.filter((s) => s.status === "repairing").length,
  };

  return (
    <AdminServicesClient
      tokoId={tokoId}
      initialServices={services}
      initialStats={stats}
      initialFilter={statusParam === "received" || statusParam === "repairing" ? statusParam : "received"}
    />
  );
}