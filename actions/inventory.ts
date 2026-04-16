"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  getAuthUser,
  requireStaffOrAdmin,
  unauthorized,
  forbidden,
  notFound,
  canAccessToko,
  type ActionResult,
  type ActionResultWithData,
} from "@/lib/rbac"

export type Sparepart = {
  id: string
  name: string
  defaultPrice: number
  stock: number
  isUniversal: boolean
  tokoId: string
}

export type ServicePricelist = {
  id: string
  title: string
  defaultPrice: number
  tokoId: string
}

export type SparepartWithCompatibilities = Sparepart & {
  compatibilities: Array<{
    hpCatalogId: string
    hpCatalog: {
      id: string
      modelName: string
      brand: { name: string }
    }
  }>
}

export type SparepartListItem = {
  id: string
  name: string
  defaultPrice: number
  stock: number
}

const createSparepartSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater"),
  stock: z.number().int().min(0, "Stock must be 0 or greater").optional(),
  isUniversal: z.boolean().optional(),
  tokoId: z.string(),
  hpCatalogIds: z.array(z.string()).optional(),
})

const updateSparepartSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").optional(),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater").optional(),
  stock: z.number().int().min(0, "Stock must be 0 or greater").optional(),
  isUniversal: z.boolean().optional(),
  hpCatalogIds: z.array(z.string()).optional(),
})

const createServicePricelistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater"),
  tokoId: z.string(),
})

const updateServicePricelistSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater").optional(),
})

export async function getSpareparts(
  tokoId: string
): Promise<ActionResultWithData<SparepartWithCompatibilities[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (!canAccessToko(user, tokoId)) return forbidden()

    const spareparts = await prisma.sparepart.findMany({
      where: { tokoId },
      include: {
        compatibilities: {
          include: {
            hpCatalog: {
              include: { brand: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: spareparts }
  } catch (error) {
    console.error("Error fetching spareparts:", error)
    return { success: false, error: "Failed to fetch spareparts" }
  }
}

export async function getCompatibleSpareparts(
  tokoId: string,
  hpCatalogId?: string
): Promise<ActionResultWithData<SparepartListItem[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (!canAccessToko(user, tokoId)) return forbidden()

    const whereClause: { tokoId: string; OR?: Array<{ isUniversal: boolean } | { compatibilities: { some: { hpCatalogId: string } } }> } = { tokoId }

    if (hpCatalogId) {
      whereClause.OR = [
        { isUniversal: true },
        { compatibilities: { some: { hpCatalogId } } },
      ]
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
    })

    return { success: true, data: spareparts }
  } catch (error) {
    console.error("Error fetching compatible spareparts:", error)
    return { success: false, error: "Failed to fetch spareparts" }
  }
}

export async function createSparepart(
  data: z.infer<typeof createSparepartSchema>
): Promise<ActionResultWithData<SparepartWithCompatibilities>> {
  try {
    const user = await requireStaffOrAdmin()

    if (!canAccessToko(user, data.tokoId)) return forbidden()

    const validated = createSparepartSchema.parse(data)

    const existing = await prisma.sparepart.findFirst({
      where: { tokoId: validated.tokoId, name: validated.name },
    })

    if (existing) {
      return forbidden("Sparepart with this name already exists")
    }

    const sparepart = await prisma.sparepart.create({
      data: {
        name: validated.name,
        defaultPrice: validated.defaultPrice,
        stock: validated.stock ?? 0,
        isUniversal: validated.isUniversal ?? false,
        tokoId: validated.tokoId,
        compatibilities: validated.hpCatalogIds
          ? { create: validated.hpCatalogIds.map((id) => ({ hpCatalogId: id })) }
          : undefined,
      },
      include: {
        compatibilities: {
          include: {
            hpCatalog: { include: { brand: { select: { name: true } } } },
          },
        },
      },
    })

    revalidatePath("/dashboard/admin/inventory")
    revalidatePath("/dashboard/staff/sparepart")

    return { success: true, data: sparepart }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating sparepart:", error)
    return { success: false, error: "Failed to create sparepart" }
  }
}

export async function updateSparepart(
  data: z.infer<typeof updateSparepartSchema>
): Promise<ActionResultWithData<SparepartWithCompatibilities>> {
  try {
    const user = await requireStaffOrAdmin()

    const validated = updateSparepartSchema.parse(data)

    const sparepart = await prisma.sparepart.findUnique({
      where: { id: validated.id },
      select: { tokoId: true },
    })

    if (!sparepart) return notFound("Sparepart")

    if (!canAccessToko(user, sparepart.tokoId)) return forbidden()

    if (validated.name) {
      const existing = await prisma.sparepart.findFirst({
        where: {
          tokoId: sparepart.tokoId,
          name: validated.name,
          id: { not: validated.id },
        },
      })
      if (existing) {
        return forbidden("Sparepart with this name already exists")
      }
    }

    const updated = await prisma.sparepart.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        defaultPrice: validated.defaultPrice,
        stock: validated.stock,
        isUniversal: validated.isUniversal,
        ...(validated.hpCatalogIds && {
          compatibilities: {
            deleteMany: {},
            create: validated.hpCatalogIds.map((id) => ({ hpCatalogId: id })),
          },
        }),
      },
      include: {
        compatibilities: {
          include: {
            hpCatalog: { include: { brand: { select: { name: true } } } },
          },
        },
      },
    })

    revalidatePath("/dashboard/admin/inventory")
    revalidatePath("/dashboard/staff/sparepart")

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating sparepart:", error)
    return { success: false, error: "Failed to update sparepart" }
  }
}

export async function deleteSparepart(id: string): Promise<ActionResult> {
  try {
    const user = await requireStaffOrAdmin()

    const sparepart = await prisma.sparepart.findUnique({
      where: { id },
      select: { tokoId: true },
    })

    if (!sparepart) return notFound("Sparepart")

    if (!canAccessToko(user, sparepart.tokoId)) return forbidden()

    const usedInServices = await prisma.serviceItem.findFirst({
      where: { referenceId: id },
    })

    if (usedInServices) {
      return forbidden("Cannot delete sparepart that is used in services")
    }

    await prisma.$transaction([
      prisma.sparepartCompatibility.deleteMany({ where: { sparepartId: id } }),
      prisma.sparepart.delete({ where: { id } }),
    ])

    revalidatePath("/dashboard/admin/gudang")
    revalidatePath("/dashboard/staff/sparepart")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error deleting sparepart:", error)
    return { success: false, error: "Failed to delete sparepart" }
  }
}

export async function getServicePricelists(
  tokoId: string
): Promise<ActionResultWithData<{ id: string; title: string; defaultPrice: number }[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (!canAccessToko(user, tokoId)) return forbidden()

    const pricelists = await prisma.servicePricelist.findMany({
      where: { tokoId },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        defaultPrice: true,
      },
    })

    return { success: true, data: pricelists }
  } catch (error) {
    console.error("Error fetching service pricelists:", error)
    return { success: false, error: "Failed to fetch service pricelists" }
  }
}

export async function createServicePricelist(
  data: z.infer<typeof createServicePricelistSchema>
): Promise<ActionResultWithData<ServicePricelist>> {
  try {
    const user = await requireStaffOrAdmin()

    if (!canAccessToko(user, data.tokoId)) return forbidden()

    const validated = createServicePricelistSchema.parse(data)

    const existing = await prisma.servicePricelist.findFirst({
      where: { tokoId: validated.tokoId, title: validated.title },
    })

    if (existing) {
      return forbidden("Service pricelist with this title already exists")
    }

    const pricelist = await prisma.servicePricelist.create({
      data: {
        title: validated.title,
        defaultPrice: validated.defaultPrice,
        tokoId: validated.tokoId,
      },
    })

    revalidatePath("/dashboard/admin/gudang")

    return { success: true, data: pricelist }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating service pricelist:", error)
    return { success: false, error: "Failed to create service pricelist" }
  }
}

export async function updateServicePricelist(
  data: z.infer<typeof updateServicePricelistSchema>
): Promise<ActionResultWithData<ServicePricelist>> {
  try {
    const user = await requireStaffOrAdmin()

    const validated = updateServicePricelistSchema.parse(data)

    const pricelist = await prisma.servicePricelist.findUnique({
      where: { id: validated.id },
      select: { tokoId: true },
    })

    if (!pricelist) return notFound("Service pricelist")

    if (!canAccessToko(user, pricelist.tokoId)) return forbidden()

    if (validated.title) {
      const existing = await prisma.servicePricelist.findFirst({
        where: {
          tokoId: pricelist.tokoId,
          title: validated.title,
          id: { not: validated.id },
        },
      })
      if (existing) {
        return forbidden("Service pricelist with this title already exists")
      }
    }

    const updated = await prisma.servicePricelist.update({
      where: { id: validated.id },
      data: {
        title: validated.title,
        defaultPrice: validated.defaultPrice,
      },
    })

    revalidatePath("/dashboard/admin/gudang")

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating service pricelist:", error)
    return { success: false, error: "Failed to update service pricelist" }
  }
}

export async function deleteServicePricelist(id: string): Promise<ActionResult> {
  try {
    const user = await requireStaffOrAdmin()

    const pricelist = await prisma.servicePricelist.findUnique({
      where: { id },
      select: { tokoId: true },
    })

    if (!pricelist) return notFound("Service pricelist")

    if (!canAccessToko(user, pricelist.tokoId)) return forbidden()

    await prisma.servicePricelist.delete({ where: { id } })

    revalidatePath("/dashboard/admin/gudang")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error deleting service pricelist:", error)
    return { success: false, error: "Failed to delete service pricelist" }
  }
}