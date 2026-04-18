import { AdminOverview } from "@/components/dashboard/admin-overview"
import { getServiceList, getAdminDashboardStats } from "@/actions"
import type { DashboardTimeFilter } from "@/actions"
import { getAuthUser } from "@/lib/rbac"
import { redirect, notFound } from "next/navigation"

type AdminPageSearchParams = {
  filter?: DashboardTimeFilter
  page?: string
}

interface AdminPageProps {
  params: Promise<{ tokoId: string }>
  searchParams: Promise<AdminPageSearchParams>
}

export default async function AdminDashboardPage({ params, searchParams }: AdminPageProps) {
  const user = await getAuthUser()

  if (!user) {
    redirect("/auth")
  }

  const { tokoId } = await params

  if (!user.tokoIds.includes(tokoId)) {
    notFound()
  }

  const search = await searchParams
  const timeFilter: DashboardTimeFilter = search.filter || "daily"
  const page = search.page ? parseInt(search.page, 10) : 1

  const serviceListFilter = timeFilter === "all" ? undefined : timeFilter

  const [result, statsResult] = await Promise.all([
    getServiceList(tokoId, serviceListFilter, page, 15),
    getAdminDashboardStats(tokoId, timeFilter),
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