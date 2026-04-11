# Authentication System

This document covers the authentication system implementation using Better Auth with Prisma and PostgreSQL.

## Overview

The authentication system provides:
- Email/Password authentication
- Google OAuth authentication
- Session management
- Protected routes

## Architecture

```
├── lib/
│   ├── auth.ts              # Server-side auth configuration
│   ├── auth-client.ts       # Client-side auth client
│   ├── get-session.ts       # Server-side session helper
│   └── prisma.ts            # Prisma client instance
├── components/
│   ├── auth-provider.tsx    # Auth context provider (wraps app)
│   └── user-info.tsx        # User info display component
├── app/
│   ├── layout.tsx           # Root layout (wraps with AuthProvider)
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts # Auth API route handler
```

## Configuration

### Server-side (`lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
```

### Client-side (`lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, useSession, signOut } = authClient;
```

## Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App URL (optional, defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Usage Examples

### 1. Get Session State

Use the `useSession` hook to access the current user session:

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### 2. Email/Password Sign Up

```tsx
"use client";

import { signUp } from "@/lib/auth-client";
import { useState } from "react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      console.error("Sign up failed:", result.error);
      return;
    }

    // Redirect or update UI
    console.log("Sign up successful!");
  };

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### 3. Email/Password Sign In

```tsx
"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      console.error("Sign in failed:", result.error);
      return;
    }

    // Redirect to dashboard or home
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### 4. Google OAuth Sign In

```tsx
"use client";

import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function GoogleSignInButton() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const result = await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    if (result.error) {
      console.error("Google sign in failed:", result.error);
      return;
    }

    // User will be redirected to Google, then back to callbackURL
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign In with Google
    </button>
  );
}
```

### 5. Sign Out

```tsx
"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
```

### 6. Protected Route (Server Component)

```tsx
// app/dashboard/page.tsx
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  );
}
```

### 7. Get User Only (Server Component)

```tsx
// Get just the user object
import { getUser } from "@/lib/get-session";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome, {user.name}</p>
    </div>
  );
}
```

### 8. Protected Route (Middleware)

Create `middleware.ts` in your project root:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/profile"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get session cookie
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 9. Using AuthProvider (Recommended)

The `AuthProvider` wraps your app and provides session data via context. This caches the session globally, reducing API calls when multiple components need session data.

First, the provider is already set up in `app/layout.tsx`:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Then use the `useAuth` hook anywhere in your app:

```tsx
"use client";

import { useAuth } from "@/components/auth-provider";

export function DashboardHeader() {
  const { session, isPending } = useAuth();

  if (isPending) return <div>Loading...</div>;
  if (!session) return null;

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <p>Role: {(session.user as any).role}</p>
    </div>
  );
}
```

Or use the direct `useSession` hook (works without provider):

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function UserAvatar() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton />;
  if (!session) return <LoginButton />;

  return <img src={session.user.image} alt={session.user.name} />;
}
```

## API Endpoints

All auth endpoints are handled by the catch-all route at `/api/auth/[...all]`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Email/password sign in |
| `/api/auth/sign-up/email` | POST | Email/password sign up |
| `/api/auth/sign-in/google` | GET | Google OAuth redirect |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/sign-out` | POST | Sign out user |

## Database Schema

Better Auth requires specific tables. Run the following to generate the schema:

```bash
bun x auth@latest generate
```

Then apply the migrations:

```bash
bunx prisma migrate dev
```

## Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
8. Copy the Client ID and Client Secret to your `.env` file

## Troubleshooting

### Session Not Persisting

- Check that cookies are being set correctly in browser DevTools
- Ensure `DATABASE_URL` is correct and database is accessible
- Verify the session table exists in the database

### Google OAuth Not Working

- Verify redirect URIs match exactly in Google Cloud Console
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Ensure the callback URL is accessible

### Database Connection Issues

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check Prisma client is generated: `bunx prisma generate`