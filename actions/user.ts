"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { hashPassword } from "@better-auth/utils/password"
import {
  requireAdmin,
  unauthorized,
  forbidden,
  notFound,
  type ActionResult,
  type ActionResultWithData,
} from "@/lib/rbac"

export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "technician"
  tokoIds: string[]
  createdAt: Date
  updatedAt: Date
}

const addUserToTokoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["staff", "technician"]),
  tokoId: z.string().min(1, "Toko ID is required"),
})

const assignUserSchema = z.object({
  userId: z.string(),
  tokoId: z.string(),
  role: z.enum(["staff", "technician"]),
})

export async function getUsersByToko(
  tokoId: string
): Promise<ActionResultWithData<{ staff: User[]; technicians: User[] }>> {
  try {
    await requireAdmin()

    const userTokos = await prisma.userToko.findMany({
      where: { tokoId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            tokoAssignments: { select: { tokoId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const users = userTokos.map((ut) => ({
      id: ut.user.id,
      name: ut.user.name,
      email: ut.user.email,
      role: ut.user.role as "admin" | "staff" | "technician",
      tokoIds: ut.user.tokoAssignments.map((a) => a.tokoId),
      createdAt: ut.user.createdAt,
      updatedAt: ut.user.updatedAt,
    }))

    const staff = users.filter((u) => u.role === "staff")
    const technicians = users.filter((u) => u.role === "technician")

    return { success: true, data: { staff, technicians } }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error fetching users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function addUserToToko(
  data: z.infer<typeof addUserToTokoSchema>
): Promise<ActionResultWithData<User>> {
  try {
    await requireAdmin()

    const validated = addUserToTokoSchema.parse(data)

    const toko = await prisma.toko.findUnique({
      where: { id: validated.tokoId },
    })

    if (!toko) return notFound("Toko")

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return forbidden("Email already registered")
    }

    const hashedPassword = await hashPassword(validated.password)
    const userId = crypto.randomUUID()

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
      },
    })

    await prisma.account.create({
      data: {
        id: `${userId}-account`,
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashedPassword,
      },
    })

    await prisma.userToko.create({
      data: {
        userId,
        tokoId: validated.tokoId,
        role: "owner",
      },
    })

    revalidatePath("/dashboard")

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "admin" | "staff" | "technician",
        tokoIds: [validated.tokoId],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error adding user:", error)
    return { success: false, error: "Failed to add user" }
  }
}

export async function searchUserByEmail(
  email: string
): Promise<ActionResultWithData<{ id: string; name: string; email: string; role: string; tokoIds: string[] }>> {
  try {
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokoAssignments: { select: { tokoId: true } },
      },
    })

    if (!user) return notFound("User")

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tokoIds: user.tokoAssignments.map((a) => a.tokoId),
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error searching user:", error)
    return { success: false, error: "Failed to search user" }
  }
}

export async function assignUserToToko(
  data: z.infer<typeof assignUserSchema>
): Promise<ActionResultWithData<User>> {
  try {
    await requireAdmin()

    const validated = assignUserSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
      include: { tokoAssignments: true },
    })

    if (!user) return notFound("User")

    if (user.tokoAssignments.length > 0) {
      return forbidden("User is already assigned to a toko")
    }

    const toko = await prisma.toko.findUnique({
      where: { id: validated.tokoId },
    })

    if (!toko) return notFound("Toko")

    await prisma.$transaction([
      prisma.user.update({
        where: { id: validated.userId },
        data: { role: validated.role },
      }),
      prisma.userToko.create({
        data: {
          userId: validated.userId,
          tokoId: validated.tokoId,
          role: "owner",
        },
      }),
    ])

    revalidatePath("/dashboard")

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: validated.role,
        tokoIds: [validated.tokoId],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("Error assigning user:", error)
    return { success: false, error: "Failed to assign user" }
  }
}

export async function removeUserFromToko(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) return notFound("User")

    if (user.role === "admin") {
      return forbidden("Cannot remove admin user")
    }

    await prisma.$transaction([
      prisma.userToko.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized()
    if (error instanceof Error && error.message === "Access denied") return forbidden()
    console.error("Error removing user:", error)
    return { success: false, error: "Failed to remove user" }
  }
}