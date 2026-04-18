import type { SubscriptionPlan, TokoStatus } from "@/lib/generated/prisma/enums"

export type SessionToko = {
  id: string
  name: string
  address: string | null
  phone: string | null
  logoUrl: string | null
  status: TokoStatus
}

export type SessionSubscription = {
  id: string
  plan: SubscriptionPlan
  createdAt: Date
  updatedAt: Date
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  subscription: SessionSubscription | null
  tokos: SessionToko[]
  tokoIds: string[]
}

declare module "better-auth/react" {
  interface Session {
    user: SessionUser
  }
}