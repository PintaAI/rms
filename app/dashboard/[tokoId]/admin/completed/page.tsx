import { getAuthUser } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import { getCompletedServices, getPickedUpServices } from "@/actions";
import { AdminCompletedClient, type ServiceTableItem } from "./completed-client";

interface CompletedPageProps {
  params: Promise<{ tokoId: string }>;
}

export default async function AdminCompletedPage({ params }: CompletedPageProps) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const { tokoId } = await params;

  if (!user.tokoIds.includes(tokoId)) {
    notFound();
  }

  const [completedResult, historyResult] = await Promise.all([
    getCompletedServices(tokoId),
    getPickedUpServices(tokoId),
  ]);

  const services: ServiceTableItem[] = completedResult.success && completedResult.data
    ? completedResult.data as ServiceTableItem[]
    : [];

  const historyServices: ServiceTableItem[] = historyResult.success && historyResult.data
    ? historyResult.data as ServiceTableItem[]
    : [];

  return (
    <AdminCompletedClient
      tokoId={tokoId}
      initialServices={services}
      initialHistory={historyServices}
    />
  );
}