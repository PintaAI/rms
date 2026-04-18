import { getAuthUser } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import { getUsersByToko, type User } from "@/actions/user";
import { AdminKaryawanClient } from "./karyawan-client";

interface KaryawanPageProps {
  params: Promise<{ tokoId: string }>;
}

export default async function AdminKaryawanPage({ params }: KaryawanPageProps) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const { tokoId } = await params;

  if (!user.tokoIds.includes(tokoId)) {
    notFound();
  }

  const result = await getUsersByToko(tokoId);

  const users: User[] = result.success && result.data
    ? [...result.data.staff, ...result.data.technicians]
    : [];

  return (
    <AdminKaryawanClient
      tokoId={tokoId}
      initialUsers={users}
    />
  );
}