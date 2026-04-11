"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

interface AuthContextType {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isPending: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();

  return (
    <AuthContext.Provider value={{ session, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}