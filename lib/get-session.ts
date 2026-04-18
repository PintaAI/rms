import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { SessionUser } from "@/lib/auth-types";

export type { SessionUser } from "@/lib/auth-types";

interface ExtendedSession {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export async function getSession(): Promise<ExtendedSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session as ExtendedSession | null;
}

export async function getUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}