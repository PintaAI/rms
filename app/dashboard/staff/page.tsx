import { StaffOverview } from "@/components/dashboard/staff-overview"
import { getServiceList } from "@/actions"
import type { ServiceTimeFilter } from "@/actions"
import { getAuthUser } from "@/lib/rbac"
import { redirect } from "next/navigation"

interface StaffPageProps {
  searchParams: Promise<{
    filter?: ServiceTimeFilter
    page?: string
  }>
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const user = await getAuthUser()

  if (!user || user.tokoIds.length === 0) {
    redirect("/auth")
  }

  const params = await searchParams
  const timeFilter: ServiceTimeFilter = (params.filter === "all" ? undefined : params.filter) || "daily"
  const page = params.page ? parseInt(params.page, 10) : 1
  const tokoId = user.tokoIds[0]

  const result = await getServiceList(tokoId, timeFilter, page, 15)
  const paginatedData = result.success && result.data ? result.data : { data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 }

  return <StaffOverview initialServices={paginatedData.data} timeFilter={timeFilter} pagination={paginatedData} />
}