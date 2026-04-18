import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://rms-psi-six.vercel.app"
    : undefined);

export const authClient = createAuthClient({
  baseURL,
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const { signIn, signUp, useSession, signOut } = authClient;