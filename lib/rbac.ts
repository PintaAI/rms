import { getUser } from "@/lib/get-session"
import prisma from "@/lib/prisma"
import type { UserRole, SubscriptionPlan } from "@/lib/generated/prisma/enums"

export type Role = UserRole
export type Plan = SubscriptionPlan

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  tokoIds: string[]
  tokos: Array<{
    id: string
    name: string
    address: string | null
    phone: string | null
    logoUrl: string | null
    status: string
  }>
  subscription?: {
    id: string
    plan: Plan
    createdAt: Date
    updatedAt: Date
  } | null
}

export interface ActionResult {
  success: boolean
  error?: string
}

export interface ActionResultWithData<T> extends ActionResult {
  data?: T
}

const UNAUTHORIZED = "Unauthorized"
const FORBIDDEN = "Access denied"
const NOT_FOUND = "Not found"

export function unauthorized(): ActionResult {
  return { success: false, error: UNAUTHORIZED }
}

export function forbidden(message?: string): ActionResult {
  return { success: false, error: message ?? FORBIDDEN }
}

export function notFound(resource?: string): ActionResult {
  return { success: false, error: resource ? `${resource} not found` : NOT_FOUND }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const sessionUser = await getUser()
  if (!sessionUser) return null

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: sessionUser.role as UserRole,
    tokoIds: sessionUser.tokoIds ?? [],
    tokos: sessionUser.tokos ?? [],
    subscription: sessionUser.subscription ?? null,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error(UNAUTHORIZED)
  }
  return user
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error(FORBIDDEN)
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(["admin"])
}

export async function requireStaff(): Promise<AuthUser> {
  return requireRole(["staff"])
}

export async function requireTechnician(): Promise<AuthUser> {
  return requireRole(["technician"])
}

export async function requireStaffOrAdmin(): Promise<AuthUser> {
  return requireRole(["admin", "staff"])
}

export async function requireTechnicianOrAdmin(): Promise<AuthUser> {
  return requireRole(["admin", "technician"])
}

export async function requireTokoAccess(targetTokoId: string): Promise<AuthUser> {
  const user = await requireAuth()

  if (!user.tokoIds.includes(targetTokoId)) {
    throw new Error(FORBIDDEN)
  }

  return user
}

export async function requireServiceAssignment(serviceId: string): Promise<AuthUser> {
  const user = await requireTechnicianOrAdmin()

  if (user.role === "admin") {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { tokoId: true },
    })
    if (!service) {
      throw new Error(NOT_FOUND)
    }
    if (!user.tokoIds.includes(service.tokoId)) {
      throw new Error(FORBIDDEN)
    }
    return user
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { technicianId: true, tokoId: true },
  })

  if (!service) {
    throw new Error(NOT_FOUND)
  }

  if (service.technicianId !== user.id) {
    throw new Error("You are not assigned to this service")
  }

  return user
}

export async function requireServiceOwnership(serviceId: string): Promise<AuthUser> {
  const user = await requireStaffOrAdmin()

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { tokoId: true },
  })

  if (!service) {
    throw new Error(NOT_FOUND)
  }

  if (!user.tokoIds.includes(service.tokoId)) {
    throw new Error(FORBIDDEN)
  }

  return user
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin"
}

export function isStaff(user: AuthUser): boolean {
  return user.role === "staff"
}

export function isTechnician(user: AuthUser): boolean {
  return user.role === "technician"
}

export function canAccessToko(user: AuthUser, tokoId: string): boolean {
  return user.tokoIds.includes(tokoId)
}

export function getTargetTokoId(user: AuthUser, requestedTokoId?: string): string | null {
  if (requestedTokoId) {
    if (!user.tokoIds.includes(requestedTokoId)) {
      return null
    }
    return requestedTokoId
  }
  return user.tokoIds[0] ?? null
}

export function validateResult<T>(result: ActionResult | ActionResultWithData<T>): boolean {
  return result.success
}

export function getSubscriptionLimit(plan: Plan): number {
  switch (plan) {
    case "free":
      return 3
    case "premium":
      return 10
    case "enterprise":
      return Infinity
    default:
      return 3
  }
}