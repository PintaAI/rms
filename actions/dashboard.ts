"use server"

import prisma from "@/lib/prisma"
import {
  getAuthUser,
  requireAdmin,
  requireStaffOrAdmin,
  unauthorized,
  forbidden,
  canAccessToko,
  getTargetTokoId,
  isAdmin,
  type ActionResult,
  type ActionResultWithData,
} from "@/lib/rbac"
import type { ServiceStatus, PaymentStatus } from "@/lib/generated/prisma/enums"

export interface TokoOverviewStats {
  totalServices: number
  pendingServices: number
  inProgressServices: number
  completedServices: number
  totalUsers: number
  totalSpareparts: number
  totalRevenue: number
  unpaidInvoices: number
}

export interface TokoDashboardData {
  toko: {
    id: string
    name: string
    address: string | null
    phone: string | null
    status: string
  }
  stats: TokoOverviewStats
  recentServices: RecentService[]
  servicesByStatus: { status: string; count: number }[]
}

export interface RecentService {
  id: string
  customerName: string | null
  noWa: string
  complaint: string
  status: ServiceStatus
  checkinAt: Date
  hpCatalog: { modelName: string; brand: { name: string } }
  technician: { id: string; name: string } | null
  createdBy: { name: string }
  invoice: { id: string; grandTotal: number; paymentStatus: PaymentStatus } | null
  passwordPattern: string | null
  imei: string | null
}

export interface AdminDashboardStats {
  totalServices: number
  receivedCount: number
  repairingCount: number
  doneCount: number
  pickedUpCount: number
  failedCount: number
  totalRevenue: number
  unpaidInvoices: number
}

export type TimeFilter = "daily" | "weekly" | "monthly" | "all"

const serviceSelectForRecent = {
  id: true,
  customerName: true,
  noWa: true,
  complaint: true,
  status: true,
  checkinAt: true,
  passwordPattern: true,
  imei: true,
  hpCatalog: {
    select: { modelName: true, brand: { select: { name: true } } },
  },
  technician: {
    select: { id: true, name: true },
  },
  createdBy: {
    select: { name: true },
  },
  invoice: {
    select: { id: true, grandTotal: true, paymentStatus: true },
  },
}

export async function getTokoDashboardData(
  tokoId: string
): Promise<ActionResultWithData<TokoDashboardData>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (!canAccessToko(user, tokoId)) return forbidden()

    const toko = await prisma.toko.findUnique({
      where: { id: tokoId },
      select: { id: true, name: true, address: true, phone: true, status: true },
    })

    if (!toko) return forbidden("Toko not found")

    const servicesByStatus = await prisma.service.groupBy({
      by: ["status"],
      where: { tokoId },
      _count: { status: true },
    })

    const [
      totalServices,
      totalUsers,
      totalSpareparts,
      revenueResult,
      unpaidInvoices,
      recentServices,
    ] = await Promise.all([
      prisma.service.count({ where: { tokoId } }),
      prisma.userToko.count({ where: { tokoId } }),
      prisma.sparepart.count({ where: { tokoId } }),
      prisma.invoice.aggregate({
        where: { service: { tokoId }, paymentStatus: "paid" },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.count({
        where: { service: { tokoId }, paymentStatus: "unpaid" },
      }),
      prisma.service.findMany({
        where: { tokoId },
        take: 10,
        orderBy: { checkinAt: "desc" },
        select: serviceSelectForRecent,
      }),
    ])

    const statusCounts = {
      received: 0,
      repairing: 0,
      done: 0,
      picked_up: 0,
      failed: 0,
    }

    servicesByStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.status
    })

    const stats: TokoOverviewStats = {
      totalServices,
      pendingServices: statusCounts.received,
      inProgressServices: statusCounts.repairing,
      completedServices: statusCounts.done + statusCounts.picked_up,
      totalUsers,
      totalSpareparts,
      totalRevenue: revenueResult._sum.grandTotal || 0,
      unpaidInvoices,
    }

    return {
      success: true,
      data: {
        toko,
        stats,
        recentServices: recentServices as RecentService[],
        servicesByStatus: servicesByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching toko dashboard data:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

export async function getAllTokoSummary(): Promise<
  ActionResultWithData<
    Array<{
      toko: { id: string; name: string; address: string | null; phone: string | null; status: string }
      stats: { totalServices: number; pendingServices: number; totalUsers: number; totalRevenue: number }
    }>
  >
> {
  try {
    await requireAdmin()

    const tokoList = await prisma.toko.findMany({
      select: { id: true, name: true, address: true, phone: true, status: true },
      orderBy: { createdAt: "desc" },
    })

    const tokoWithStats = await Promise.all(
      tokoList.map(async (toko) => {
        const [totalServices, pendingServices, totalUsers, revenueResult] = await Promise.all([
          prisma.service.count({ where: { tokoId: toko.id } }),
          prisma.service.count({ where: { tokoId: toko.id, status: "received" } }),
          prisma.userToko.count({ where: { tokoId: toko.id } }),
          prisma.invoice.aggregate({
            where: { service: { tokoId: toko.id }, paymentStatus: "paid" },
            _sum: { grandTotal: true },
          }),
        ])

        return {
          toko,
          stats: {
            totalServices,
            pendingServices,
            totalUsers,
            totalRevenue: revenueResult._sum.grandTotal || 0,
          },
        }
      })
    )

    return { success: true, data: tokoWithStats }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching all toko summary:", error)
    return { success: false, error: "Failed to fetch toko summary" }
  }
}

export async function getAdminDashboardStats(
  tokoId?: string,
  timeFilter: TimeFilter = "daily"
): Promise<ActionResultWithData<AdminDashboardStats>> {
  try {
    const user = await requireStaffOrAdmin()

    const targetTokoId = getTargetTokoId(user, tokoId)

    if (!targetTokoId) {
      return {
        success: true,
        data: {
          totalServices: 0,
          receivedCount: 0,
          repairingCount: 0,
          doneCount: 0,
          pickedUpCount: 0,
          failedCount: 0,
          totalRevenue: 0,
          unpaidInvoices: 0,
        },
      }
    }

    const timeFilterWhere = buildTimeFilter(timeFilter)

    const [statusCounts, revenueResult, unpaidInvoices] = await Promise.all([
      prisma.service.groupBy({
        by: ["status"],
        where: { tokoId: targetTokoId, ...timeFilterWhere },
        _count: { status: true },
      }),
      prisma.invoice.aggregate({
        where: {
          service: { tokoId: targetTokoId, ...timeFilterWhere },
          paymentStatus: "paid",
        },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.count({
        where: {
          service: { tokoId: targetTokoId, ...timeFilterWhere },
          paymentStatus: "unpaid",
        },
      }),
    ])

    const counts = {
      received: 0,
      repairing: 0,
      done: 0,
      picked_up: 0,
      failed: 0,
    }

    statusCounts.forEach((item) => {
      counts[item.status as keyof typeof counts] = item._count.status
    })

    const totalServices = Object.values(counts).reduce((sum, count) => sum + count, 0)

    return {
      success: true,
      data: {
        totalServices,
        receivedCount: counts.received,
        repairingCount: counts.repairing,
        doneCount: counts.done,
        pickedUpCount: counts.picked_up,
        failedCount: counts.failed,
        totalRevenue: revenueResult._sum.grandTotal || 0,
        unpaidInvoices,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching admin dashboard stats:", error)
    return { success: false, error: "Failed to fetch dashboard stats" }
  }
}

export async function getCompletedServiceCounts(
  tokoId?: string
): Promise<ActionResultWithData<{ done: number; failed: number; total: number }>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const targetTokoId = tokoId && user.tokoIds.includes(tokoId) ? tokoId : user.tokoIds[0]

    if (!targetTokoId) {
      return { success: true, data: { done: 0, failed: 0, total: 0 } }
    }

    const [done, failed] = await Promise.all([
      prisma.service.count({ where: { tokoId: targetTokoId, status: "done" } }),
      prisma.service.count({ where: { tokoId: targetTokoId, status: "failed" } }),
    ])

    return { success: true, data: { done, failed, total: done + failed } }
  } catch (error) {
    console.error("Error fetching completed service counts:", error)
    return { success: false, error: "Failed to fetch counts" }
  }
}

function buildTimeFilter(filter: TimeFilter): Record<string, unknown> {
  if (filter === "all") return {}

  const now = new Date()
  let startDate: Date

  switch (filter) {
    case "daily":
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      break
    case "weekly":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "monthly":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      return {}
  }

  return { checkinAt: { gte: startDate } }
}