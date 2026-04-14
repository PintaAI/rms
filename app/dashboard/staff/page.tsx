import { StaffOverview } from "@/components/dashboard/staff-overview";
import { getStaffServiceList, type TimeFilter } from "@/actions/staff";
import { getUser } from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

interface StaffPageProps {
  searchParams: Promise<{
    filter?: TimeFilter;
    page?: string;
  }>;
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const sessionUser = await getUser();
  
  if (!sessionUser) {
    redirect("/auth");
  }

  // Get user's toko info
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { tokoId: true, role: true },
  });

  if (!user || !user.tokoId) {
    redirect("/auth");
  }

  // Get time filter and page from search params
  const params = await searchParams;
  const timeFilter: TimeFilter = params.filter || "daily";
  const page = params.page ? parseInt(params.page, 10) : 1;

  // Fetch services with server-side filtering and pagination
  const result = await getStaffServiceList(user.tokoId, timeFilter, page, 15);
  const paginatedData = result.success && result.data ? result.data : { data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 };

  return <StaffOverview initialServices={paginatedData.data} timeFilter={timeFilter} pagination={paginatedData} />;
}
