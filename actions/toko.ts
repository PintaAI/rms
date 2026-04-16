"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  getAuthUser,
  requireAdmin,
  requireTokoAccess,
  unauthorized,
  forbidden,
  notFound,
  canAccessToko,
  getSubscriptionLimit,
  type ActionResult,
  type ActionResultWithData,
} from "@/lib/rbac"

export type Toko = {
  id: string
  name: string
  address: string | null
  phone: string | null
  logoUrl: string | null
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

const createTokoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
})

const updateTokoSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function getAllToko(): Promise<ActionResultWithData<Toko[]>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    if (user.tokoIds.length === 0) {
      return forbidden("User is not assigned to any toko")
    }

    const tokoList = await prisma.toko.findMany({
      where: { id: { in: user.tokoIds } },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: tokoList }
  } catch (error) {
    console.error("Error fetching toko:", error)
    return { success: false, error: "Failed to fetch toko data" }
  }
}

export async function getTokoById(id: string): Promise<ActionResultWithData<Toko>> {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const toko = await prisma.toko.findUnique({
      where: { id },
    })

    if (!toko) return notFound("Toko")

    if (!canAccessToko(user, id)) return forbidden()

    return { success: true, data: toko }
  } catch (error) {
    console.error("Error fetching toko:", error)
    return { success: false, error: "Failed to fetch toko data" }
  }
}

export async function createToko(
  data: z.infer<typeof createTokoSchema>
): Promise<ActionResultWithData<Toko>> {
  try {
    const user = await requireAdmin()

    const plan = user.subscription?.plan ?? "free"
    const limit = getSubscriptionLimit(plan)

    const currentCount = await prisma.userToko.count({
      where: { userId: user.id },
    })

    if (currentCount >= limit) {
      return forbidden(`Toko limit reached (${limit} for ${plan} plan). Upgrade to create more.`)
    }

    const validated = createTokoSchema.parse(data)

    const toko = await prisma.toko.create({
      data: {
        name: validated.name,
        address: validated.address || null,
        phone: validated.phone || null,
        logoUrl: validated.logoUrl || null,
        status: validated.status || "active",
      },
    })

    await prisma.userToko.create({
      data: {
        userId: user.id,
        tokoId: toko.id,
        role: "owner",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin/toko")

    return { success: true, data: toko }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error creating toko:", error)
    return { success: false, error: "Failed to create toko" }
  }
}

export async function updateToko(
  data: z.infer<typeof updateTokoSchema>
): Promise<ActionResultWithData<Toko>> {
  try {
    const user = await requireAdmin()

    const validated = updateTokoSchema.parse(data)
    const { id, ...updateData } = validated

    await requireTokoAccess(id)

    const existingToko = await prisma.toko.findUnique({
      where: { id },
    })

    if (!existingToko) return notFound("Toko")

    const toko = await prisma.toko.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin/toko")

    return { success: true, data: toko }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error updating toko:", error)
    return { success: false, error: "Failed to update toko" }
  }
}

export async function deleteToko(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    await requireTokoAccess(id)

    const existingToko = await prisma.toko.findUnique({
      where: { id },
      select: {
        id: true,
        userAssignments: { select: { userId: true }, take: 1 },
        services: { select: { id: true }, take: 1 },
        spareparts: { select: { id: true }, take: 1 },
      },
    })

    if (!existingToko) return notFound("Toko")

    if (existingToko.userAssignments.length > 1) {
      return forbidden("Cannot delete toko with other assigned users")
    }

    if (existingToko.services.length > 0) {
      return forbidden("Cannot delete toko with service records")
    }

    if (existingToko.spareparts.length > 0) {
      return forbidden("Cannot delete toko with spareparts")
    }

    await prisma.$transaction([
      prisma.userToko.deleteMany({ where: { tokoId: id } }),
      prisma.toko.delete({ where: { id } }),
    ])

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin/toko")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error deleting toko:", error)
    return { success: false, error: "Failed to delete toko" }
  }
}

export async function getTokoLimit(): Promise<
  ActionResultWithData<{ current: number; limit: number; plan: string }>
> {
  try {
    const user = await requireAdmin()

    const plan = user.subscription?.plan ?? "free"
    const limit = getSubscriptionLimit(plan)

    const currentCount = await prisma.userToko.count({
      where: { userId: user.id },
    })

    return {
      success: true,
      data: {
        current: currentCount,
        limit: limit === Infinity ? -1 : limit,
        plan,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching toko limit:", error)
    return { success: false, error: "Failed to fetch toko limit" }
  }
}