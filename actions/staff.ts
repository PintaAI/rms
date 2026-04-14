"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/get-session";

// Staff service list item interface
export interface ServiceListItem {
  id: string;
  hpCatalogId: string;
  customerName: string | null;
  noWa: string;
  complaint: string;
  note?: string | null;
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
  createdBy?: {
    name: string;
  };
  passwordPattern?: string | null;
  imei?: string | null;
}

// Staff service stats interface
export interface StaffServiceStats {
  totalServices: number;
  receivedCount: number;
  repairingCount: number;
  doneCount: number;
  pickedUpCount: number;
}

// Time filter type for staff dashboard
export type TimeFilter = "daily" | "weekly" | "monthly";

// Pagination result type
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Get all services for staff (for the services list page)
export async function getStaffServiceList(
  tokoId?: string,
  timeFilter?: TimeFilter,
  page: number = 1,
  pageSize: number = 15
): Promise<{
  success: boolean;
  data?: PaginatedResult<ServiceListItem>;
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

    // Staff and technician can view their toko's services
    // Admin can view any toko's services
    const targetTokoId = tokoId || user.tokoId;
    
    if (!targetTokoId) {
      return { success: false, error: "No toko specified" };
    }

    if (user.role === "staff" || user.role === "technician") {
      if (user.tokoId !== targetTokoId) {
        return { success: false, error: "Access denied" };
      }
    } else if (user.role !== "admin") {
      return { success: false, error: "Access denied" };
    }

    // Build time filter for server-side filtering
    let timeFilterCondition = {};
    if (timeFilter) {
      const now = new Date();
      let startDate: Date;

      switch (timeFilter) {
        case "daily":
          // Start of today (midnight)
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      timeFilterCondition = {
        checkinAt: { gte: startDate },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.service.count({
      where: {
        tokoId: targetTokoId,
        ...timeFilterCondition,
      },
    });

    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;

    const services = await prisma.service.findMany({
      where: {
        tokoId: targetTokoId,
        ...timeFilterCondition,
      },
      orderBy: { checkinAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        hpCatalogId: true,
        customerName: true,
        noWa: true,
        complaint: true,
        note: true,
        status: true,
        checkinAt: true,
        doneAt: true,
        checkoutAt: true,
        passwordPattern: true,
        imei: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: { select: { name: true } },
          },
        },
        technician: { select: { id: true, name: true } },
        invoice: {
          select: {
            id: true,
            grandTotal: true,
            paymentStatus: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: {
        data: services,
        total: totalCount,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching staff service list:", error);
    return { success: false, error: "Failed to fetch service list" };
  }
}

// Get completed services (status: done) for staff
export async function getCompletedServices(tokoId?: string): Promise<{
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

    // Staff and technician can view their toko's services
    // Admin can view any toko's services
    const targetTokoId = tokoId || user.tokoId;
    
    if (!targetTokoId) {
      return { success: false, error: "No toko specified" };
    }

    if (user.role === "staff" || user.role === "technician") {
      if (user.tokoId !== targetTokoId) {
        return { success: false, error: "Access denied" };
      }
    } else if (user.role !== "admin") {
      return { success: false, error: "Access denied" };
    }

    const services = await prisma.service.findMany({
      where: {
        tokoId: targetTokoId,
        status: { in: ["done", "failed"] }  // Completed and failed services awaiting pickup
      },
      orderBy: { doneAt: "desc" },
      select: {
        id: true,
        hpCatalogId: true,
        customerName: true,
        noWa: true,
        complaint: true,
        note: true,
        status: true,
        checkinAt: true,
        doneAt: true,
        checkoutAt: true,
        passwordPattern: true,
        imei: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: { select: { name: true } },
          },
        },
        technician: { select: { id: true, name: true } },
        invoice: {
          select: {
            id: true,
            grandTotal: true,
            paymentStatus: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return { success: true, data: services };
  } catch (error) {
    console.error("Error fetching completed services:", error);
    return { success: false, error: "Failed to fetch completed services" };
  }
}

// Get picked up services history (status: picked_up)
export async function getPickedUpServices(tokoId?: string): Promise<{
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

    const targetTokoId = tokoId || user.tokoId;
    
    if (!targetTokoId) {
      return { success: false, error: "No toko specified" };
    }

    if (user.role === "staff" || user.role === "technician") {
      if (user.tokoId !== targetTokoId) {
        return { success: false, error: "Access denied" };
      }
    } else if (user.role !== "admin") {
      return { success: false, error: "Access denied" };
    }

    const services = await prisma.service.findMany({
      where: {
        tokoId: targetTokoId,
        status: "picked_up"
      },
      orderBy: { checkoutAt: "desc" },
      select: {
        id: true,
        hpCatalogId: true,
        customerName: true,
        noWa: true,
        complaint: true,
        note: true,
        status: true,
        checkinAt: true,
        doneAt: true,
        checkoutAt: true,
        passwordPattern: true,
        imei: true,
        hpCatalog: {
          select: {
            modelName: true,
            brand: { select: { name: true } },
          },
        },
        technician: { select: { id: true, name: true } },
        invoice: {
          select: {
            id: true,
            grandTotal: true,
            paymentStatus: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return { success: true, data: services };
  } catch (error) {
    console.error("Error fetching picked up services:", error);
    return { success: false, error: "Failed to fetch picked up services" };
  }
}

// Mark service as picked up (staff only)
export async function markServiceAsPickedUp(
  serviceId: string
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

    // Only staff and admin can mark as picked up
    if (user.role !== "staff" && user.role !== "admin") {
      return { success: false, error: "Only staff can mark services as picked up" };
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, tokoId: true, status: true },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Check authorization
    if (user.role === "staff" && user.tokoId !== service.tokoId) {
      return { success: false, error: "Access denied" };
    }

    // Only services with status "done" can be marked as picked up
    if (service.status !== "done") {
      return { success: false, error: "Only completed services can be marked as picked up" };
    }

    // Update status to picked_up and set checkoutAt
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: "picked_up",
        checkoutAt: new Date(),
      },
    });

    // Mark invoice as paid if it exists (separate operation to avoid error if no invoice)
    await prisma.invoice.updateMany({
      where: {
        serviceId: serviceId,
      },
      data: {
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking service as picked up:", error);
    return { success: false, error: "Failed to mark service as picked up" };
  }
}

// Mark invoice as paid
export async function markInvoiceAsPaid(
  invoiceId: string
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

    // Only staff and admin can mark invoices as paid
    if (user.role !== "staff" && user.role !== "admin") {
      return { success: false, error: "Only staff can mark invoices as paid" };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, service: { select: { tokoId: true } } },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Check authorization
    if (user.role === "staff" && user.tokoId !== invoice.service.tokoId) {
      return { success: false, error: "Access denied" };
    }

    // Update invoice payment status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    return { success: false, error: "Failed to mark invoice as paid" };
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

// Update an existing service ticket (staff only)
export async function updateService(serviceId: string, data: {
  hpCatalogId: string;
  customerName?: string;
  noWa: string;
  complaint: string;
  passwordPattern?: string;
  imei?: string;
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
      select: { id: true, tokoId: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.role !== "staff") {
      return { success: false, error: "Only staff can update services" };
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

    // Verify the service exists and belongs to this toko
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true },
    });

    if (!existingService) {
      return { success: false, error: "Service not found" };
    }

    if (existingService.tokoId !== user.tokoId) {
      return { success: false, error: "Access denied" };
    }

    // Verify the hpCatalog exists
    const hpCatalog = await prisma.hpCatalog.findUnique({
      where: { id: data.hpCatalogId },
    });

    if (!hpCatalog) {
      return { success: false, error: "Invalid device selected" };
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        hpCatalogId: data.hpCatalogId,
        customerName: data.customerName || null,
        noWa: data.noWa,
        complaint: data.complaint,
        passwordPattern: data.passwordPattern || null,
        imei: data.imei || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating service:", error);
    return { success: false, error: "Failed to update service" };
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

// Delete a service
export async function deleteService(serviceId: string): Promise<{
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

    // Get the service to check permissions
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        tokoId: true,
        status: true,
        invoice: {
          select: { paymentStatus: true }
        }
      },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Check permissions - staff can only delete from their toko, admin can delete any
    if (user.role === "staff" || user.role === "technician") {
      if (user.tokoId !== service.tokoId) {
        return { success: false, error: "Access denied" };
      }
    } else if (user.role !== "admin") {
      return { success: false, error: "Access denied" };
    }

    // Only allow deletion of services that haven't been picked up
    if (service.status === "picked_up") {
      return { success: false, error: "Cannot delete a service that has already been picked up" };
    }

    // Prevent deletion if invoice is paid
    if (service.invoice?.paymentStatus === "paid") {
      return { success: false, error: "Cannot delete a service with a paid invoice" };
    }

    // Delete related records first (cascade manually)
    // Delete service items
    await prisma.serviceItem.deleteMany({
      where: { serviceId },
    });

    // Delete invoice if exists
    await prisma.invoice.deleteMany({
      where: { serviceId },
    });

    // Delete service logs
    await prisma.serviceLog.deleteMany({
      where: { serviceId },
    });

    // Delete notification logs
    await prisma.notificationLog.deleteMany({
      where: { serviceId },
    });

    // Delete the service
    await prisma.service.delete({
      where: { id: serviceId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, error: "Failed to delete service" };
  }
}
