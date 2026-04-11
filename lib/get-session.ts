import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the current session on the server side.
 * Returns the session object if authenticated, null otherwise.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the current user from the session.
 * Returns the user object if authenticated, null otherwise.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}