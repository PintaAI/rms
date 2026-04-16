import { AdminOverview } from "@/components/dashboard/admin-overview"
import { getServiceList, getAdminDashboardStats } from "@/actions"
import type { DashboardTimeFilter } from "@/actions"
import { getAuthUser } from "@/lib/rbac"
import { redirect } from "next/navigation"

type AdminPageSearchParams = {
  filter?: DashboardTimeFilter
  page?: string
  tokoId?: string
}

interface AdminPageProps {
  searchParams: Promise<AdminPageSearchParams>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await getAuthUser()

  if (!user || user.tokoIds.length === 0) {
    redirect("/auth")
  }

  const params = await searchParams
  const timeFilter: DashboardTimeFilter = params.filter || "daily"
  const page = params.page ? parseInt(params.page, 10) : 1
  const targetTokoId = params.tokoId && user.tokoIds.includes(params.tokoId) 
    ? params.tokoId 
    : user.tokoIds[0]

  const serviceListFilter = timeFilter === "all" ? undefined : timeFilter

  const [result, statsResult] = await Promise.all([
    getServiceList(targetTokoId, serviceListFilter, page, 15),
    getAdminDashboardStats(targetTokoId, timeFilter),
  ])

  const paginatedData = result.success && result.data ? result.data : { data: [], total: 0, page: 1, pageSize: 15, totalPages: 0 }

  const dashboardStats = statsResult.success && statsResult.data ? statsResult.data : {
    totalServices: 0,
    receivedCount: 0,
    repairingCount: 0,
    doneCount: 0,
    pickedUpCount: 0,
    totalRevenue: 0,
    unpaidInvoices: 0,
  }

  return (
    <AdminOverview
      initialServices={paginatedData.data}
      timeFilter={timeFilter}
      pagination={paginatedData}
      dashboardStats={dashboardStats}
    />
  )
}