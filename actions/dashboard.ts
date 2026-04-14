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
  hpCatalogId: string;
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
    id: string;
    name: string;
  } | null;
  createdBy: {
    name: string;
  };
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  passwordPattern?: string | null;
  imei?: string | null;
}

// Extended type for technician tasks with items
export interface TechnicianTaskService {
  id: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  status: string;
  checkinAt: Date;
  doneAt: Date | null;
  passwordPattern: string | null;
  imei: string | null;
  hpCatalog: {
    id: string;
    modelName: string;
    brand: {
      name: string;
    };
  };
  technician: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    name: string;
  };
  invoice: {
    id: string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  items: Array<{
    id: string;
    type: string;
    name: string;
    qty: number;
    price: number;
  }>;
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
        hpCatalogId: true,
        customerName: true,
        noWa: true,
        complaint: true,
        status: true,
        checkinAt: true,
        passwordPattern: true,
        imei: true,
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
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
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
  myTasks: TechnicianTaskService[];
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
          hpCatalogId: true,
          customerName: true,
          noWa: true,
          complaint: true,
          status: true,
          checkinAt: true,
          passwordPattern: true,
          imei: true,
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
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              name: true,
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
          doneAt: true,
          passwordPattern: true,
          imei: true,
          hpCatalog: {
            select: {
              id: true,
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
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
          invoice: {
            select: {
              id: true,
              grandTotal: true,
              paymentStatus: true,
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
    id: string;
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
            id: true,
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

    // If sparepart type, check and deduct stock
    if (data.type === "sparepart" && data.sparepartId) {
      const sparepart = await prisma.sparepart.findUnique({
        where: { id: data.sparepartId },
        select: { stock: true },
      });

      if (!sparepart) {
        return { success: false, error: "Sparepart not found" };
      }

      if (sparepart.stock < data.qty) {
        return { success: false, error: `Insufficient stock. Available: ${sparepart.stock}` };
      }

      // Create service item and deduct stock in a transaction
      await prisma.$transaction([
        prisma.serviceItem.create({
          data: {
            serviceId: data.serviceId,
            type: data.type,
            name: data.name,
            qty: data.qty,
            price: data.price,
            referenceId: data.sparepartId,
          },
        }),
        prisma.sparepart.update({
          where: { id: data.sparepartId },
          data: { stock: { decrement: data.qty } },
        }),
      ]);
    } else {
      // Create service item (non-sparepart)
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
    }

    // Create or update invoice with calculated grand total
    await prisma.$transaction(async (tx) => {
      // Calculate total from all service items
      const items = await tx.serviceItem.aggregate({
        where: { serviceId: data.serviceId },
        _sum: {
          price: true,
        },
      });

      const grandTotal = (items._sum.price as number) || 0;

      // Upsert invoice (create if not exists, update if exists)
      await tx.invoice.upsert({
        where: { serviceId: data.serviceId },
        create: {
          serviceId: data.serviceId,
          grandTotal,
          paymentStatus: "unpaid",
        },
        update: {
          grandTotal,
        },
      });
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
        type: true,
        qty: true,
        referenceId: true,
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

    // If sparepart type, restore stock
    if (item.type === "sparepart" && item.referenceId) {
      await prisma.$transaction([
        prisma.serviceItem.delete({
          where: { id: itemId },
        }),
        prisma.sparepart.update({
          where: { id: item.referenceId },
          data: { stock: { increment: item.qty } },
        }),
      ]);
    } else {
      await prisma.serviceItem.delete({
        where: { id: itemId },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing service item:", error);
    return { success: false, error: "Failed to remove item" };
  }
}

// Get spareparts for technician (from their toko), filtered by device compatibility
export async function getTechnicianSpareparts(hpCatalogId?: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    defaultPrice: number;
    stock: number;
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

    // Build the where clause: filter by toko and (universal OR compatible with device)
    const whereClause: {
      tokoId: string;
      OR?: Array<{ isUniversal: boolean } | { compatibilities: { some: { hpCatalogId: string } } }>;
    } = {
      tokoId: user.tokoId,
    };

    // If hpCatalogId is provided, filter to only universal or compatible spareparts
    if (hpCatalogId) {
      whereClause.OR = [
        { isUniversal: true },
        { compatibilities: { some: { hpCatalogId } } },
      ];
    }

    const spareparts = await prisma.sparepart.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        stock: true,
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

// Get technicians by toko ID
export async function getTechniciansByToko(tokoId: string): Promise<{
  success: boolean;
  data?: { id: string; name: string; email: string }[];
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

    // Only admin and staff can view technicians
    if (user.role !== "admin" && user.role !== "staff") {
      return { success: false, error: "You don't have permission to view technicians" };
    }

    // Admin can view any toko's technicians, staff can only view their own toko
    if (user.role === "staff" && user.tokoId !== tokoId) {
      return { success: false, error: "You don't have permission to view this toko's technicians" };
    }

    const technicians = await prisma.user.findMany({
      where: {
        tokoId: tokoId,
        role: "technician",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: technicians };
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return { success: false, error: "Failed to fetch technicians" };
  }
}

// Assign technician to a service (admin only)
export async function assignTechnicianToService(
  serviceId: string,
  technicianId: string | null
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
      select: { id: true, role: true, tokoId: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Only admin can assign technicians
    if (user.role !== "admin") {
      return { success: false, error: "Only admins can assign technicians" };
    }

    // Get the service to check its toko
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, tokoId: true, technicianId: true, status: true },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Verify the admin has access to this service's toko
    if (user.tokoId && user.tokoId !== service.tokoId) {
      return { success: false, error: "You don't have permission to modify this service" };
    }

    // If assigning a technician, verify they belong to the same toko
    if (technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: technicianId },
        select: { id: true, tokoId: true, role: true },
      });

      if (!technician || technician.role !== "technician") {
        return { success: false, error: "Invalid technician" };
      }

      if (technician.tokoId !== service.tokoId) {
        return { success: false, error: "Technician does not belong to this toko" };
      }
    }

    // Update the service with the new technician
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        technicianId: technicianId,
        assignedAt: technicianId ? new Date() : null,
        status: technicianId && service.status === "received" ? "repairing" : undefined,
      },
    });

    // Create a log entry for this action
    await prisma.serviceLog.create({
      data: {
        serviceId: serviceId,
        userId: user.id,
        action: technicianId ? "ASSIGN_TECHNICIAN" : "UNASSIGN_TECHNICIAN",
        oldValue: service.technicianId,
        newValue: technicianId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning technician:", error);
    return { success: false, error: "Failed to assign technician" };
  }
}