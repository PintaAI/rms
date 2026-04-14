import { AdminOverview } from "@/components/dashboard/admin-overview";
import { getStaffServiceList, type TimeFilter } from "@/actions/staff";
import { getUser } from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

interface AdminPageProps {
  searchParams: Promise<{
    filter?: TimeFilter;
    page?: string;
    tokoId?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const sessionUser = await getUser();
  
  if (!sessionUser) {
    redirect("/auth");
  }

  // Get user's toko info
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { tokoId: true, role: true },
  });

  if (!user) {
    redirect("/auth");
  }

  // Admin role can have a null tokoId (schema: "null for admin")
  // Non-admin users without a toko are sent back to auth
  if (user.role !== "admin" && !user.tokoId) {
    redirect("/auth");
  }

  // Get time filter, page, and tokoId from search params
  const params = await searchParams;
  const timeFilter: TimeFilter = params.filter || "daily";
  const page = params.page ? parseInt(params.page, 10) : 1;
  // Admin selects a toko in the UI; the client syncs it via ?tokoId=
  // Fall back to user.tokoId (non-admin) or undefined (admin with no selection yet)
  const targetTokoId = params.tokoId ?? user.tokoId ?? undefined;

  // Fetch services with server-side filtering and pagination
  const result = await getStaffServiceList(targetTokoId, timeFilter, page, 15);
  const paginatedData = result.success && result.data ? result.data : { data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 };

  return <AdminOverview initialServices={paginatedData.data} timeFilter={timeFilter} pagination={paginatedData} />;
}
