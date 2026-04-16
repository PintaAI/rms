import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://rms-psi-six.vercel.app"
      : "http://localhost:3000"),
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

// Export specific methods for convenience
export const { signIn, signUp, useSession, signOut } = authClient;