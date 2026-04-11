"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/get-session";

// Types for dashboard data
export interface TokoOverviewStats {
  totalServices: number;
  pendingServices: number;
  inProgressServices: number;
  completedServices: number;
  totalUsers: number;
  totalBrands: number;
  totalSpareparts: number;
  totalRevenue: number;
  unpaidInvoices: number;
}

export interface RecentService {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  status: string;
  checkinAt: Date;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  technician: {
    name: string;
  } | null;
}

export interface TokoDashboardData {
  toko: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    status: string;
  };
  stats: TokoOverviewStats;
  recentServices: RecentService[];
  servicesByStatus: {
    status: string;
    count: number;
  }[];
}

// Get dashboard data for a specific toko
export async function getTokoDashboardData(tokoId: string): Promise<{
  success: boolean;
  data?: TokoDashboardData;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch the user's role and tokoId from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check authorization - admin can view any toko, others only their own
    if (user.role !== "admin" && user.tokoId !== tokoId) {
      return {
        success: false,
        error: "You don't have permission to view this toko",
      };
    }

    // Get toko info
    const toko = await prisma.toko.findUnique({
      where: { id: tokoId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        status: true,
      },
    });

    if (!toko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    // Get service counts by status
    const servicesByStatus = await prisma.service.groupBy({
      by: ["status"],
      where: { tokoId },
      _count: {
        status: true,
      },
    });

    // Calculate stats
    const [
      totalServices,
      totalUsers,
      totalBrands,
      totalSpareparts,
      revenueResult,
      unpaidInvoices,
    ] = await Promise.all([
      // Total services
      prisma.service.count({ where: { tokoId } }),
      // Total users (staff + technician)
      prisma.user.count({ where: { tokoId } }),
      // Total brands
      prisma.brand.count({ where: { tokoId } }),
      // Total spareparts
      prisma.sparepart.count({ where: { tokoId } }),
      // Total revenue from paid invoices
      prisma.invoice.aggregate({
        where: {
          service: { tokoId },
          paymentStatus: "paid",
        },
        _sum: {
          grandTotal: true,
        },
      }),
      // Unpaid invoices count
      prisma.invoice.count({
        where: {
          service: { tokoId },
          paymentStatus: "unpaid",
        },
      }),
    ]);

    // Get status counts
    const statusCounts = {
      received: 0,
      repairing: 0,
      done: 0,
      picked_up: 0,
    };

    servicesByStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.status;
    });

    const stats: TokoOverviewStats = {
      totalServices,
      pendingServices: statusCounts.received,
      inProgressServices: statusCounts.repairing,
      completedServices: statusCounts.done + statusCounts.picked_up,
      totalUsers,
      totalBrands,
      totalSpareparts,
      totalRevenue: revenueResult._sum.grandTotal || 0,
      unpaidInvoices,
    };

    // Get recent services (last 10)
    const recentServices = await prisma.service.findMany({
      where: { tokoId },
      take: 10,
      orderBy: { checkinAt: "desc" },
      select: {
        id: true,
        customerName: true,
        noWa: true,
        complaint: true,
        status: true,
        checkinAt: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
        technician: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        toko,
        stats,
        recentServices,
        servicesByStatus: servicesByStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching toko dashboard data:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard data",
    };
  }
}

// Get all toko summary for admin overview
export async function getAllTokoSummary(): Promise<{
  success: boolean;
  data?: Array<{
    toko: {
      id: string;
      name: string;
      address: string | null;
      phone: string | null;
      status: string;
    };
    stats: {
      totalServices: number;
      pendingServices: number;
      totalUsers: number;
      totalRevenue: number;
    };
  }>;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch the user's role from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return {
        success: false,
        error: "Only admins can view all toko summary",
      };
    }

    // Get all toko
    const tokoList = await prisma.toko.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stats for each toko
    const tokoWithStats = await Promise.all(
      tokoList.map(async (toko) => {
        const [totalServices, pendingServices, totalUsers, revenueResult] =
          await Promise.all([
            prisma.service.count({ where: { tokoId: toko.id } }),
            prisma.service.count({
              where: { tokoId: toko.id, status: "received" },
            }),
            prisma.user.count({ where: { tokoId: toko.id } }),
            prisma.invoice.aggregate({
              where: {
                service: { tokoId: toko.id },
                paymentStatus: "paid",
              },
              _sum: {
                grandTotal: true,
              },
            }),
          ]);

        return {
          toko,
          stats: {
            totalServices,
            pendingServices,
            totalUsers,
            totalRevenue: revenueResult._sum.grandTotal || 0,
          },
        };
      })
    );

    return {
      success: true,
      data: tokoWithStats,
    };
  } catch (error) {
    console.error("Error fetching all toko summary:", error);
    return {
      success: false,
      error: "Failed to fetch toko summary",
    };
  }
}