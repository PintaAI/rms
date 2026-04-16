"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  getAuthUser,
  requireAuth,
  requireRole,
  requireAdmin,
  requireStaff,
  requireStaffOrAdmin,
  requireTechnician,
  requireTechnicianOrAdmin,
  requireTokoAccess,
  requireServiceAssignment,
  requireServiceOwnership,
  unauthorized,
  forbidden,
  notFound,
  isAdmin,
  isStaff,
  isTechnician,
  getTargetTokoId,
  canAccessToko,
  type AuthUser,
  type ActionResult,
  type ActionResultWithData,
} from "@/lib/rbac"
import type { ServiceStatus, PaymentStatus, ItemType } from "@/lib/generated/prisma/enums"

export type TimeFilter = "daily" | "weekly" | "monthly" | "all"

export interface ServiceListItem {
  id: string
  hpCatalogId: string
  customerName: string | null
  noWa: string
  complaint: string
  note: string | null
  status: ServiceStatus
  checkinAt: Date
  doneAt: Date | null
  checkoutAt: Date | null
  passwordPattern: string | null
  imei: string | null
  hpCatalog: {
    id: string
    modelName: string
    brand: { name: string }
  }
  technician: { id: string; name: string } | null
  createdBy: { name: string } | undefined
  invoice: {
    id: string
    grandTotal: number
    paymentStatus: PaymentStatus
  } | null
}

export interface ServiceDetail extends ServiceListItem {
  tokoId: string
  items: ServiceItem[]
}

export interface ServiceItem {
  id: string
  type: ItemType
  name: string
  qty: number
  price: number
  referenceId: string | null
}

export interface ServiceStats {
  total: number
  received: number
  repairing: number
  done: number
  pickedUp: number
  failed: number
}

export interface TechnicianStats {
  totalAssigned: number
  availableCount: number
  inProgressCount: number
  doneCount: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const serviceSelectBase = {
  id: true,
  customerName: true,
  noWa: true,
  complaint: true,
  status: true,
  checkinAt: true,
  doneAt: true,
  checkoutAt: true,
  passwordPattern: true,
  imei: true,
  note: true,
  hpCatalog: {
    select: {
      id: true,
      modelName: true,
      brand: { select: { name: true } },
    },
  },
  technician: {
    select: { id: true, name: true },
  },
  createdBy: {
    select: { name: true },
  },
  invoice: {
    select: {
      id: true,
      grandTotal: true,
      paymentStatus: true,
    },
  },
}

const serviceItemSelect = {
  id: true,
  type: true,
  name: true,
  qty: true,
  price: true,
  referenceId: true,
}

function mapServiceToListItem(service: any): ServiceListItem {
  return {
    id: service.id,
    hpCatalogId: service.hpCatalog.id,
    customerName: service.customerName,
    noWa: service.noWa,
    complaint: service.complaint,
    note: service.note,
    status: service.status,
    checkinAt: service.checkinAt,
    doneAt: service.doneAt,
    checkoutAt: service.checkoutAt,
    passwordPattern: service.passwordPattern,
    imei: service.imei,
    hpCatalog: {
      id: service.hpCatalog.id,
      modelName: service.hpCatalog.modelName,
      brand: { name: service.hpCatalog.brand.name },
    },
    technician: service.technician,
    createdBy: service.createdBy ?? undefined,
    invoice: service.invoice,
  }
}

export async function getServiceList(
  tokoId?: string,
  timeFilter?: TimeFilter,
  page: number = 1,
  pageSize: number = 15,
  statusFilter?: ServiceStatus[]
): Promise<ActionResultWithData<PaginatedResult<ServiceListItem>>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const targetTokoId = getTargetTokoId(user, tokoId)
    if (!targetTokoId) return forbidden("No toko specified")

    if (!canAccessToko(user, targetTokoId)) return forbidden()

    const timeFilterCondition = buildTimeFilter(timeFilter)
    const statusCondition = statusFilter && statusFilter.length > 0 
      ? { status: { in: statusFilter } } 
      : {}

    const totalCount = await prisma.service.count({
      where: { tokoId: targetTokoId, ...timeFilterCondition, ...statusCondition },
    })

    const skip = (page - 1) * pageSize
    const totalPages = Math.ceil(totalCount / pageSize)

    const services = await prisma.service.findMany({
      where: { tokoId: targetTokoId, ...timeFilterCondition, ...statusCondition },
      orderBy: { checkinAt: "desc" },
      skip,
      take: pageSize,
      select: serviceSelectBase,
    })

    return {
      success: true,
      data: {
        data: services.map(mapServiceToListItem),
        total: totalCount,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error("Error fetching service list:", error)
    return { success: false, error: "Failed to fetch service list" }
  }
}

export async function getService(serviceId: string): Promise<ActionResultWithData<ServiceDetail>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        ...serviceSelectBase,
        tokoId: true,
        items: { select: serviceItemSelect },
      },
    })

    if (!service) return notFound("Service")

    if (!canAccessToko(user, service.tokoId)) return forbidden()

    return {
      success: true,
      data: {
        ...mapServiceToListItem(service),
        tokoId: service.tokoId,
        items: service.items,
      },
    }
  } catch (error) {
    console.error("Error fetching service:", error)
    return { success: false, error: "Failed to fetch service" }
  }
}

export async function getCompletedServices(tokoId?: string): Promise<ActionResultWithData<ServiceListItem[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const targetTokoId = getTargetTokoId(user, tokoId)
    if (!targetTokoId) return forbidden("No toko specified")

    if (!canAccessToko(user, targetTokoId)) return forbidden()

    const services = await prisma.service.findMany({
      where: { tokoId: targetTokoId, status: { in: ["done", "failed"] } },
      orderBy: { doneAt: "desc" },
      select: serviceSelectBase,
    })

    return { success: true, data: services.map(mapServiceToListItem) }
  } catch (error) {
    console.error("Error fetching completed services:", error)
    return { success: false, error: "Failed to fetch completed services" }
  }
}

export async function getPickedUpServices(tokoId?: string): Promise<ActionResultWithData<ServiceListItem[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const targetTokoId = getTargetTokoId(user, tokoId)
    if (!targetTokoId) return forbidden("No toko specified")

    if (!canAccessToko(user, targetTokoId)) return forbidden()

    const services = await prisma.service.findMany({
      where: { tokoId: targetTokoId, status: "picked_up" },
      orderBy: { checkoutAt: "desc" },
      select: serviceSelectBase,
    })

    return { success: true, data: services.map(mapServiceToListItem) }
  } catch (error) {
    console.error("Error fetching picked up services:", error)
    return { success: false, error: "Failed to fetch picked up services" }
  }
}

export async function getAvailableTasks(tokoId?: string): Promise<ActionResultWithData<ServiceListItem[]>> {
  try {
    const user = await requireTechnicianOrAdmin()

    const targetTokoId = getTargetTokoId(user, tokoId)
    if (!targetTokoId) return forbidden("No toko specified")

    if (!canAccessToko(user, targetTokoId)) return forbidden()

    const services = await prisma.service.findMany({
      where: {
        tokoId: targetTokoId,
        status: "received",
        technicianId: null,
      },
      orderBy: { checkinAt: "asc" },
      take: 10,
      select: serviceSelectBase,
    })

    return { success: true, data: services.map(mapServiceToListItem) }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching available tasks:", error)
    return { success: false, error: "Failed to fetch available tasks" }
  }
}

export async function getMyTasks(): Promise<ActionResultWithData<ServiceDetail[]>> {
  try {
    const user = await requireTechnician()

    const services = await prisma.service.findMany({
      where: { technicianId: user.id },
      orderBy: [{ status: "asc" }, { checkinAt: "asc" }],
      select: {
        ...serviceSelectBase,
        tokoId: true,
        items: { select: serviceItemSelect },
      },
    })

    return {
      success: true,
      data: services.map((s) => ({
        ...mapServiceToListItem(s),
        tokoId: s.tokoId,
        items: s.items,
      })),
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching my tasks:", error)
    return { success: false, error: "Failed to fetch tasks" }
  }
}

export async function getAllTasks(tokoId: string): Promise<ActionResultWithData<ServiceDetail[]>> {
  try {
    const user = await requireAdmin()

    const services = await prisma.service.findMany({
      where: { tokoId, technicianId: { not: null } },
      orderBy: [{ status: "asc" }, { checkinAt: "asc" }],
      select: {
        ...serviceSelectBase,
        tokoId: true,
        items: { select: serviceItemSelect },
      },
    })

    return {
      success: true,
      data: services.map((s) => ({
        ...mapServiceToListItem(s),
        tokoId: s.tokoId,
        items: s.items,
      })),
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching all tasks:", error)
    return { success: false, error: "Failed to fetch tasks" }
  }
}

export async function getMyStats(): Promise<ActionResultWithData<TechnicianStats>> {
  try {
    const user = await requireTechnician()

    const userTokoId = user.tokoIds[0]
    if (!userTokoId) return forbidden("User is not assigned to a toko")

    const [totalAssigned, availableCount, inProgressCount, doneCount] = await Promise.all([
      prisma.service.count({ where: { technicianId: user.id } }),
      prisma.service.count({
        where: { tokoId: userTokoId, status: "received", technicianId: null },
      }),
      prisma.service.count({ where: { technicianId: user.id, status: "repairing" } }),
      prisma.service.count({
        where: { technicianId: user.id, status: { in: ["done", "picked_up"] } },
      }),
    ])

    return {
      success: true,
      data: { totalAssigned, availableCount, inProgressCount, doneCount },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching technician stats:", error)
    return { success: false, error: "Failed to fetch stats" }
  }
}

export interface TechnicianDashboardData {
  stats: TechnicianStats
  availableServices: ServiceListItem[]
  myTasks: ServiceDetail[]
}

export async function getTechnicianDashboard(): Promise<ActionResultWithData<TechnicianDashboardData>> {
  try {
    const user = await requireTechnician()

    if (user.tokoIds.length === 0) return forbidden("User is not assigned to a toko")

    const userTokoId = user.tokoIds[0]
    const [
      totalAssigned,
      availableCount,
      inProgressCount,
      doneCount,
      availableServices,
      myTasks,
    ] = await Promise.all([
      prisma.service.count({ where: { technicianId: user.id } }),
      prisma.service.count({
        where: { tokoId: userTokoId, status: "received", technicianId: null },
      }),
      prisma.service.count({ where: { technicianId: user.id, status: "repairing" } }),
      prisma.service.count({
        where: { technicianId: user.id, status: { in: ["done", "picked_up"] } },
      }),
      prisma.service.findMany({
        where: { tokoId: userTokoId, status: "received", technicianId: null },
        orderBy: { checkinAt: "asc" },
        take: 10,
        select: serviceSelectBase,
      }),
      prisma.service.findMany({
        where: { technicianId: user.id, status: { in: ["received", "repairing"] } },
        orderBy: { checkinAt: "asc" },
        take: 10,
        select: {
          ...serviceSelectBase,
          tokoId: true,
          items: { select: serviceItemSelect },
        },
      }),
    ])

    const stats: TechnicianStats = {
      totalAssigned,
      availableCount,
      inProgressCount,
      doneCount,
    }

    return {
      success: true,
      data: {
        stats,
        availableServices: availableServices.map(mapServiceToListItem),
        myTasks: myTasks.map((s) => ({
          ...mapServiceToListItem(s),
          tokoId: s.tokoId,
          items: s.items,
        })),
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching technician dashboard:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

const createServiceSchema = z.object({
  hpCatalogId: z.string().min(1),
  customerName: z.string().optional(),
  noWa: z.string().min(1),
  complaint: z.string().min(1),
  passwordPattern: z.string().optional(),
  imei: z.string().optional(),
})

const updateServiceSchema = createServiceSchema

export async function createService(
  data: z.infer<typeof createServiceSchema>,
  tokoId?: string
): Promise<ActionResultWithData<{ id: string }>> {
  try {
    const user = await requireStaffOrAdmin()

    if (isAdmin(user)) {
      if (!tokoId) return forbidden("No toko specified")
      await requireTokoAccess(tokoId)
    } else {
      tokoId = user.tokoIds[0]
      if (!tokoId) return forbidden("User is not assigned to a toko")
    }

    const validated = createServiceSchema.parse(data)

    const hpCatalog = await prisma.hpCatalog.findUnique({
      where: { id: validated.hpCatalogId },
    })
    if (!hpCatalog) return notFound("Device")

    const service = await prisma.service.create({
      data: {
        tokoId: tokoId!,
        hpCatalogId: validated.hpCatalogId,
        createdById: user.id,
        customerName: validated.customerName || null,
        noWa: validated.noWa,
        complaint: validated.complaint,
        passwordPattern: validated.passwordPattern || null,
        imei: validated.imei || null,
        status: "received",
      },
      select: { id: true },
    })

    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true, data: { id: service.id } }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating service:", error)
    return { success: false, error: "Failed to create service" }
  }
}

export async function updateService(
  serviceId: string,
  data: z.infer<typeof updateServiceSchema>
): Promise<ActionResult> {
  try {
    const user = await requireStaffOrAdmin()

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true },
    })
    if (!service) return notFound("Service")

    if (!canAccessToko(user, service.tokoId)) return forbidden()

    const validated = updateServiceSchema.parse(data)

    const hpCatalog = await prisma.hpCatalog.findUnique({
      where: { id: validated.hpCatalogId },
    })
    if (!hpCatalog) return notFound("Device")

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        hpCatalogId: validated.hpCatalogId,
        customerName: validated.customerName || null,
        noWa: validated.noWa,
        complaint: validated.complaint,
        passwordPattern: validated.passwordPattern || null,
        imei: validated.imei || null,
      },
    })

    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating service:", error)
    return { success: false, error: "Failed to update service" }
  }
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (isTechnician(user)) return forbidden("Technicians cannot delete services")

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true, status: true, invoice: { select: { paymentStatus: true } } },
    })
    if (!service) return notFound("Service")

    if (!canAccessToko(user, service.tokoId)) return forbidden()

    if (service.status === "picked_up") {
      return forbidden("Cannot delete a service that has been picked up")
    }

    if (service.invoice?.paymentStatus === "paid") {
      return forbidden("Cannot delete a service with a paid invoice")
    }

    await prisma.$transaction([
      prisma.serviceItem.deleteMany({ where: { serviceId } }),
      prisma.invoice.deleteMany({ where: { serviceId } }),
      prisma.serviceLog.deleteMany({ where: { serviceId } }),
      prisma.notificationLog.deleteMany({ where: { serviceId } }),
      prisma.service.delete({ where: { id: serviceId } }),
    ])

    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    console.error("Error deleting service:", error)
    return { success: false, error: "Failed to delete service" }
  }
}

export async function takeService(serviceId: string): Promise<ActionResult> {
  try {
    const user = await requireTechnician()

    const userTokoId = user.tokoIds[0]
    if (!userTokoId) return forbidden("User is not assigned to a toko")

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true, status: true, technicianId: true },
    })
    if (!service) return notFound("Service")

    if (service.tokoId !== userTokoId) return forbidden("Service is from a different toko")

    if (service.status !== "received") return forbidden("Service is not available")

    if (service.technicianId) return forbidden("Service already has a technician")

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        technicianId: user.id,
        status: "repairing",
        assignedAt: new Date(),
      },
    })

    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error taking service:", error)
    return { success: false, error: "Failed to take service" }
  }
}

export async function updateStatus(
  serviceId: string,
  status: ServiceStatus,
  note?: string
): Promise<ActionResult> {
  try {
    await requireServiceAssignment(serviceId)

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status,
        ...(status === "done" || status === "failed" ? { doneAt: new Date() } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    })

    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/staff/completed")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof Error && error.message === "Not found") return notFound("Service")
    console.error("Error updating status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function pickupService(serviceId: string): Promise<ActionResult> {
  try {
    const user = await requireStaffOrAdmin()

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true, status: true },
    })
    if (!service) return notFound("Service")

    if (!canAccessToko(user, service.tokoId)) return forbidden()

    if (service.status !== "done" && service.status !== "failed") {
      return forbidden("Only completed services can be marked as picked up")
    }

    await prisma.$transaction([
      prisma.service.update({
        where: { id: serviceId },
        data: { status: "picked_up", checkoutAt: new Date() },
      }),
      prisma.invoice.updateMany({
        where: { serviceId },
        data: { paymentStatus: "paid", paidAt: new Date() },
      }),
    ])

    revalidatePath("/dashboard/staff/completed")
    revalidatePath("/dashboard/staff/picked-up")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error picking up service:", error)
    return { success: false, error: "Failed to mark as picked up" }
  }
}

export async function assignTechnician(
  serviceId: string,
  technicianId: string | null
): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true, technicianId: true, status: true },
    })
    if (!service) return notFound("Service")

    if (technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: technicianId },
        select: { role: true, tokoAssignments: { select: { tokoId: true } } },
      })
      if (!technician || technician.role !== "technician") {
        return forbidden("Invalid technician")
      }
      const technicianTokoIds = technician.tokoAssignments.map((a) => a.tokoId)
      if (!technicianTokoIds.includes(service.tokoId)) {
        return forbidden("Technician does not belong to this toko")
      }
    }

    await prisma.$transaction([
      prisma.service.update({
        where: { id: serviceId },
        data: {
          technicianId,
          assignedAt: technicianId ? new Date() : null,
          status: technicianId && service.status === "received" ? "repairing" : undefined,
        },
      }),
      prisma.serviceLog.create({
        data: {
          serviceId,
          userId: user.id,
          action: technicianId ? "ASSIGN_TECHNICIAN" : "UNASSIGN_TECHNICIAN",
          oldValue: service.technicianId,
          newValue: technicianId,
        },
      }),
    ]).catch((err) => {
      console.error("Transaction failed:", err)
      throw err
    })

    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    console.log(`Technician ${technicianId ? "assigned" : "unassigned"} for service ${serviceId}`)

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error assigning technician:", error)
    return { success: false, error: "Failed to assign technician" }
  }
}

const addItemSchema = z.object({
  serviceId: z.string(),
  type: z.enum(["sparepart", "service"]),
  sparepartId: z.string().optional(),
  name: z.string().min(1),
  qty: z.number().int().min(1),
  price: z.number().int().min(0),
})

export async function addItem(data: z.infer<typeof addItemSchema>): Promise<ActionResult> {
  try {
    await requireServiceAssignment(data.serviceId)

    const validated = addItemSchema.parse(data)

    if (validated.type === "sparepart" && validated.sparepartId) {
      const sparepart = await prisma.sparepart.findUnique({
        where: { id: validated.sparepartId },
        select: { stock: true },
      })
      if (!sparepart) return notFound("Sparepart")
      if (sparepart.stock < validated.qty) {
        return forbidden(`Insufficient stock. Available: ${sparepart.stock}`)
      }

      await prisma.$transaction([
        prisma.serviceItem.create({
          data: {
            serviceId: validated.serviceId,
            type: validated.type,
            name: validated.name,
            qty: validated.qty,
            price: validated.price,
            referenceId: validated.sparepartId,
          },
        }),
        prisma.sparepart.update({
          where: { id: validated.sparepartId },
          data: { stock: { decrement: validated.qty } },
        }),
      ])
    } else {
      await prisma.serviceItem.create({
        data: {
          serviceId: validated.serviceId,
          type: validated.type,
          name: validated.name,
          qty: validated.qty,
          price: validated.price,
          referenceId: validated.sparepartId || null,
        },
      })
    }

    await updateInvoiceTotal(validated.serviceId)

    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error adding item:", error)
    return { success: false, error: "Failed to add item" }
  }
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireTechnicianOrAdmin()

    const item = await prisma.serviceItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        type: true,
        qty: true,
        referenceId: true,
        serviceId: true,
        service: { select: { technicianId: true } },
      },
    })
    if (!item) return notFound("Item")

    if (isTechnician(user) && item.service.technicianId !== user.id) {
      return forbidden("You are not assigned to this service")
    }

    if (item.type === "sparepart" && item.referenceId) {
      await prisma.$transaction([
        prisma.serviceItem.delete({ where: { id: itemId } }),
        prisma.sparepart.update({
          where: { id: item.referenceId },
          data: { stock: { increment: item.qty } },
        }),
      ])
    } else {
      await prisma.serviceItem.delete({ where: { id: itemId } })
    }

    await updateInvoiceTotal(item.serviceId)

    revalidatePath("/dashboard/technician/tasks")
    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error removing item:", error)
    return { success: false, error: "Failed to remove item" }
  }
}

export async function payInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const user = await requireStaffOrAdmin()

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { service: { select: { tokoId: true } } },
    })
    if (!invoice) return notFound("Invoice")

    if (!canAccessToko(user, invoice.service.tokoId)) return forbidden()

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paymentStatus: "paid", paidAt: new Date() },
    })

    revalidatePath("/dashboard/staff/services")
    revalidatePath("/dashboard/staff")
    revalidatePath("/dashboard/admin/services")
    revalidatePath("/dashboard/admin")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error paying invoice:", error)
    return { success: false, error: "Failed to pay invoice" }
  }
}

async function updateInvoiceTotal(serviceId: string) {
  const items = await prisma.serviceItem.aggregate({
    where: { serviceId },
    _sum: { price: true },
  })

  const grandTotal = (items._sum.price as number) || 0

  await prisma.invoice.upsert({
    where: { serviceId },
    create: { serviceId, grandTotal, paymentStatus: "unpaid" },
    update: { grandTotal },
  })
}

function buildTimeFilter(filter?: TimeFilter): Record<string, unknown> {
  if (!filter || filter === "all") return {}

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

export async function getTechniciansByToko(
  tokoId: string
): Promise<ActionResultWithData<{ id: string; name: string; email: string }[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (!canAccessToko(user, tokoId)) return forbidden()

    const technicians = await prisma.userToko.findMany({
      where: {
        tokoId,
        user: { role: "technician" },
      },
      select: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
    })

    return { success: true, data: technicians.map((t) => t.user) }
  } catch (error) {
    console.error("Error fetching technicians:", error)
    return { success: false, error: "Failed to fetch technicians" }
  }
}