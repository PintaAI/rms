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
      // Total brands (now global, count all)
      prisma.brand.count(),
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

// Staff-specific types
export interface StaffServiceStats {
  totalServices: number;
  receivedCount: number;
  repairingCount: number;
  doneCount: number;
  pickedUpCount: number;
}

export interface StaffDashboardData {
  stats: StaffServiceStats;
  recentServices: RecentService[];
  todayServices: RecentService[];
}

// Get staff dashboard data - services created by this staff member
export async function getStaffDashboardData(): Promise<{
  success: boolean;
  data?: StaffDashboardData;
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
      select: { id: true, name: true, tokoId: true, role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Only staff and technician can access this
    if (user.role !== "staff" && user.role !== "technician") {
      return {
        success: false,
        error: "Access denied",
      };
    }

    if (!user.tokoId) {
      return {
        success: false,
        error: "User is not assigned to a toko",
      };
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get services created by this staff member
    const [
      totalServices,
      receivedCount,
      repairingCount,
      doneCount,
      pickedUpCount,
      recentServices,
      todayServices,
    ] = await Promise.all([
      // Total services created by this staff
      prisma.service.count({
        where: { createdById: user.id },
      }),
      // Services by status
      prisma.service.count({
        where: { createdById: user.id, status: "received" },
      }),
      prisma.service.count({
        where: { createdById: user.id, status: "repairing" },
      }),
      prisma.service.count({
        where: { createdById: user.id, status: "done" },
      }),
      prisma.service.count({
        where: { createdById: user.id, status: "picked_up" },
      }),
      // Recent services (last 10)
      prisma.service.findMany({
        where: { createdById: user.id },
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
      }),
      // Today's services
      prisma.service.findMany({
        where: {
          createdById: user.id,
          checkinAt: {
            gte: today,
            lt: tomorrow,
          },
        },
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
      }),
    ]);

    const stats: StaffServiceStats = {
      totalServices,
      receivedCount,
      repairingCount,
      doneCount,
      pickedUpCount,
    };

    return {
      success: true,
      data: {
        stats,
        recentServices,
        todayServices,
      },
    };
  } catch (error) {
    console.error("Error fetching staff dashboard data:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard data",
    };
  }
}

// Get all services for staff (for the services list page)
export interface ServiceListItem {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  status: string;
  checkinAt: Date;
  doneAt: Date | null;
  checkoutAt: Date | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  technician: {
    name: string;
  } | null;
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
}

export async function getStaffServiceList(): Promise<{
  success: boolean;
  data?: ServiceListItem[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "staff") {
      return { success: false, error: "Access denied" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    const services = await prisma.service.findMany({
      where: { tokoId: user.tokoId },
      orderBy: { checkinAt: "desc" },
      select: {
        id: true,
        customerName: true,
        noWa: true,
        complaint: true,
        status: true,
        checkinAt: true,
        doneAt: true,
        checkoutAt: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: { select: { name: true } },
          },
        },
        technician: { select: { name: true } },
        invoice: {
          select: {
            id: true,
            grandTotal: true,
            paymentStatus: true,
          },
        },
      },
    });

    return { success: true, data: services };
  } catch (error) {
    console.error("Error fetching staff service list:", error);
    return { success: false, error: "Failed to fetch service list" };
  }
}

// Create a new service ticket (staff only)
export async function createService(data: {
  hpCatalogId: string;
  customerName?: string;
  noWa: string;
  complaint: string;
  passwordPattern?: string;
  imei?: string;
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "staff") {
      return { success: false, error: "Only staff can create services" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    if (!data.noWa || !data.complaint || !data.hpCatalogId) {
      return {
        success: false,
        error: "Phone number, complaint, and device are required",
      };
    }

    // HpCatalog is now global, so we just need to verify it exists
    const hpCatalog = await prisma.hpCatalog.findUnique({
      where: { id: data.hpCatalogId },
    });

    if (!hpCatalog) {
      return { success: false, error: "Invalid device selected" };
    }

    const service = await prisma.service.create({
      data: {
        tokoId: user.tokoId,
        hpCatalogId: data.hpCatalogId,
        createdById: user.id,
        customerName: data.customerName || null,
        noWa: data.noWa,
        complaint: data.complaint,
        passwordPattern: data.passwordPattern || null,
        imei: data.imei || null,
        status: "received",
      },
      select: { id: true },
    });

    return { success: true, data: { id: service.id } };
  } catch (error) {
    console.error("Error creating service:", error);
    return { success: false, error: "Failed to create service" };
  }
}

// Search HP catalogs globally (for autocomplete)
export async function searchHpCatalogs(query: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    modelName: string;
    brandName: string;
  }>;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Split query to support "brand model" combos (e.g. "iphone 13" → brand:"iphone" + model:"13")
    const queryWords = query.trim().split(/\s+/);
    const firstWord = queryWords[0];
    const restWords = queryWords.slice(1).join(" ");

    // Search globally across all HpCatalogs (not toko-specific)
    const hpCatalogs = await prisma.hpCatalog.findMany({
      where: {
        OR: [
          // Full query in model name (e.g. "13 Pro Max")
          { modelName: { contains: query, mode: "insensitive" } },
          // Full query in brand name (e.g. "Samsung")
          { brand: { name: { contains: query, mode: "insensitive" } } },
          // Brand+model split: first word matches brand, rest matches model
          // Handles "iphone 13" → brand LIKE "iphone" AND model LIKE "13"
          ...(queryWords.length >= 2
            ? [
                {
                  AND: [
                    {
                      brand: {
                        name: { contains: firstWord, mode: "insensitive" as const },
                      },
                    },
                    { modelName: { contains: restWords, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ brand: { name: "asc" } }, { modelName: "asc" }],
      select: {
        id: true,
        modelName: true,
        brand: { select: { name: true } },
      },
      take: 20, // Limit results for autocomplete
    });

    return {
      success: true,
      data: hpCatalogs.map((catalog) => ({
        id: catalog.id,
        modelName: catalog.modelName,
        brandName: catalog.brand.name,
      })),
    };
  } catch (error) {
    console.error("Error searching hp catalogs:", error);
    return { success: false, error: "Failed to search devices" };
  }
}

// Create a new brand (global)
export async function createBrand(name: string): Promise<{
  success: boolean;
  data?: { id: string; name: string };
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if brand already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { name },
    });

    if (existingBrand) {
      return { success: true, data: existingBrand };
    }

    // Create new brand
    const brand = await prisma.brand.create({
      data: { name },
      select: { id: true, name: true },
    });

    return { success: true, data: brand };
  } catch (error) {
    console.error("Error creating brand:", error);
    return { success: false, error: "Failed to create brand" };
  }
}

// Search brands by name (global)
export async function searchBrands(query: string): Promise<{
  success: boolean;
  data?: { id: string; name: string }[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const brands = await prisma.brand.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 10,
    });

    return { success: true, data: brands };
  } catch (error) {
    console.error("Error searching brands:", error);
    return { success: false, error: "Failed to search brands" };
  }
}

// Create a new HpCatalog (global) - with brand creation if needed
export async function createHpCatalog(data: {
  brandName: string;
  modelName: string;
  modelNumber?: string;
}): Promise<{
  success: boolean;
  data?: { id: string; modelName: string; brandName: string };
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.brandName || !data.modelName) {
      return { success: false, error: "Brand name and model name are required" };
    }

    // Create or get existing brand
    const brandResult = await createBrand(data.brandName);
    if (!brandResult.success || !brandResult.data) {
      return { success: false, error: brandResult.error || "Failed to create brand" };
    }

    // Check if HpCatalog already exists for this brand + model
    const existingCatalog = await prisma.hpCatalog.findFirst({
      where: {
        brandId: brandResult.data.id,
        modelName: data.modelName,
      },
      include: { brand: true },
    });

    if (existingCatalog) {
      return {
        success: true,
        data: {
          id: existingCatalog.id,
          modelName: existingCatalog.modelName,
          brandName: existingCatalog.brand.name,
        },
      };
    }

    // Create new HpCatalog
    const hpCatalog = await prisma.hpCatalog.create({
      data: {
        brandId: brandResult.data.id,
        modelName: data.modelName,
        modelNumber: data.modelNumber || null,
      },
      include: { brand: true },
    });

    return {
      success: true,
      data: {
        id: hpCatalog.id,
        modelName: hpCatalog.modelName,
        brandName: hpCatalog.brand.name,
      },
    };
  } catch (error) {
    console.error("Error creating hp catalog:", error);
    return { success: false, error: "Failed to create device" };
  }
}

// Get HP catalogs for the current user's toko (for dropdown) - now global
export async function getHpCatalogsForService(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    modelName: string;
    brandName: string;
  }>;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all HpCatalogs globally (not toko-specific)
    const hpCatalogs = await prisma.hpCatalog.findMany({
      orderBy: [{ brand: { name: "asc" } }, { modelName: "asc" }],
      select: {
        id: true,
        modelName: true,
        brand: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: hpCatalogs.map((catalog) => ({
        id: catalog.id,
        modelName: catalog.modelName,
        brandName: catalog.brand.name,
      })),
    };
  } catch (error) {
    console.error("Error fetching hp catalogs:", error);
    return { success: false, error: "Failed to fetch devices" };
  }
}

// Technician-specific types
export interface TechnicianServiceStats {
  totalAssigned: number;
  availableCount: number;
  inProgressCount: number;
  doneCount: number;
}

export interface TechnicianDashboardData {
  stats: TechnicianServiceStats;
  availableServices: RecentService[];
  myTasks: RecentService[];
}

// Get technician dashboard data
export async function getTechnicianDashboardData(): Promise<{
  success: boolean;
  data?: TechnicianDashboardData;
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
      select: { id: true, name: true, tokoId: true, role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Only technician can access this
    if (user.role !== "technician") {
      return {
        success: false,
        error: "Access denied",
      };
    }

    if (!user.tokoId) {
      return {
        success: false,
        error: "User is not assigned to a toko",
      };
    }

    // Get services counts
    const [
      totalAssigned,
      availableCount,
      inProgressCount,
      doneCount,
      availableServices,
      myTasks,
    ] = await Promise.all([
      // Total services assigned to this technician
      prisma.service.count({
        where: { technicianId: user.id },
      }),
      // Available services (received, no technician assigned) in the same toko
      prisma.service.count({
        where: {
          tokoId: user.tokoId,
          status: "received",
          technicianId: null,
        },
      }),
      // Services in progress (assigned to this technician, status repairing)
      prisma.service.count({
        where: {
          technicianId: user.id,
          status: "repairing",
        },
      }),
      // Services done by this technician
      prisma.service.count({
        where: {
          technicianId: user.id,
          status: { in: ["done", "picked_up"] },
        },
      }),
      // Available services (received, no technician) - last 10
      prisma.service.findMany({
        where: {
          tokoId: user.tokoId,
          status: "received",
          technicianId: null,
        },
        take: 10,
        orderBy: { checkinAt: "asc" }, // Oldest first (FIFO)
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
      }),
      // My current tasks (assigned to me, not done yet)
      prisma.service.findMany({
        where: {
          technicianId: user.id,
          status: { in: ["received", "repairing"] },
        },
        take: 10,
        orderBy: { checkinAt: "asc" },
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
      }),
    ]);

    const stats: TechnicianServiceStats = {
      totalAssigned,
      availableCount,
      inProgressCount,
      doneCount,
    };

    return {
      success: true,
      data: {
        stats,
        availableServices,
        myTasks,
      },
    };
  } catch (error) {
    console.error("Error fetching technician dashboard data:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard data",
    };
  }
}

// Technician takes a service (assigns themselves)
export async function technicianTakeService(serviceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Only technicians can take services" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    // Check if service exists and is available
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, tokoId: true, status: true, technicianId: true },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    if (service.tokoId !== user.tokoId) {
      return { success: false, error: "Service is from a different toko" };
    }

    if (service.status !== "received") {
      return { success: false, error: "Service is not available" };
    }

    if (service.technicianId) {
      return { success: false, error: "Service already has a technician" };
    }

    // Assign technician and update status to repairing
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        technicianId: user.id,
        status: "repairing",
        assignedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error taking service:", error);
    return { success: false, error: "Failed to take service" };
  }
}

// Get technician's task list (all services assigned to them)
export interface TechnicianTaskItem {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  passwordPattern: string | null;
  imei: string | null;
  status: string;
  checkinAt: Date;
  doneAt: Date | null;
  hpCatalog: {
    modelName: string;
    brand: {
      name: string;
    };
  };
  items: Array<{
    id: string;
    type: string;
    name: string;
    qty: number;
    price: number;
  }>;
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
}

export async function getTechnicianTasks(): Promise<{
  success: boolean;
  data?: TechnicianTaskItem[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Access denied" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    const tasks = await prisma.service.findMany({
      where: { technicianId: user.id },
      orderBy: [
        { status: "asc" }, // received/repairing first, then done/picked_up
        { checkinAt: "asc" },
      ],
      select: {
        id: true,
        customerName: true,
        noWa: true,
        complaint: true,
        passwordPattern: true,
        imei: true,
        status: true,
        checkinAt: true,
        doneAt: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: { select: { name: true } },
          },
        },
        items: {
          select: {
            id: true,
            type: true,
            name: true,
            qty: true,
            price: true,
          },
        },
        invoice: {
          select: {
            id: true,
            grandTotal: true,
            paymentStatus: true,
          },
        },
      },
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error("Error fetching technician tasks:", error);
    return { success: false, error: "Failed to fetch tasks" };
  }
}

// Update service status
export async function updateServiceStatus(
  serviceId: string,
  status: "received" | "repairing" | "done" | "picked_up"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Only technicians can update status" };
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, technicianId: true },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    if (service.technicianId !== user.id) {
      return { success: false, error: "You are not assigned to this service" };
    }

    // Update status and set doneAt if status is done
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status,
        ...(status === "done" ? { doneAt: new Date() } : {}),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating service status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

// Add service item (sparepart or service)
export async function addServiceItem(data: {
  serviceId: string;
  type: "sparepart" | "service";
  sparepartId?: string;
  name: string;
  qty: number;
  price: number;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true, tokoId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Only technicians can add items" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      select: { id: true, technicianId: true, tokoId: true },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    if (service.technicianId !== user.id) {
      return { success: false, error: "You are not assigned to this service" };
    }

    // Create service item
    await prisma.serviceItem.create({
      data: {
        serviceId: data.serviceId,
        type: data.type,
        name: data.name,
        qty: data.qty,
        price: data.price,
        referenceId: data.sparepartId || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding service item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

// Remove service item
export async function removeServiceItem(itemId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Only technicians can remove items" };
    }

    const item = await prisma.serviceItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        service: {
          select: { technicianId: true },
        },
      },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.service.technicianId !== user.id) {
      return { success: false, error: "You are not assigned to this service" };
    }

    await prisma.serviceItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing service item:", error);
    return { success: false, error: "Failed to remove item" };
  }
}

// Get spareparts for technician (from their toko)
export async function getTechnicianSpareparts(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    defaultPrice: number;
  }>;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Access denied" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    const spareparts = await prisma.sparepart.findMany({
      where: { tokoId: user.tokoId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
      },
    });

    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error fetching spareparts:", error);
    return { success: false, error: "Failed to fetch spareparts" };
  }
}

// Get service pricelists for technician (from their toko)
export async function getTechnicianServicePricelists(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    title: string;
    defaultPrice: number;
  }>;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "technician") {
      return { success: false, error: "Access denied" };
    }

    if (!user.tokoId) {
      return { success: false, error: "User is not assigned to a toko" };
    }

    const pricelists = await prisma.servicePricelist.findMany({
      where: { tokoId: user.tokoId },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        defaultPrice: true,
      },
    });

    return { success: true, data: pricelists };
  } catch (error) {
    console.error("Error fetching service pricelists:", error);
    return { success: false, error: "Failed to fetch service pricelists" };
  }
}