import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Define protected and public routes
const protectedRoutes = ['/dashboard']
const publicRoutes = ['/auth', '/']

// Role-based redirect mappings
const roleRedirects: Record<string, string> = {
  admin: '/dashboard/admin',
  technician: '/dashboard/technician',
  staff: '/dashboard/staff',
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Check if the current route is protected or public
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  )
  const isPublicRoute = publicRoutes.includes(path)

  // Check if user is already on their role-specific dashboard
  const isRoleDashboard = /^\/dashboard\/(admin|staff|technician)/.test(path)

  // Get session using Better Auth
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  const sessionToken = session?.session?.token
  const userRole = (session?.user as any)?.role

  // If user is authenticated and tries to access /auth, redirect to role-based dashboard
  if (isPublicRoute && sessionToken && path === '/auth') {
    if (userRole && roleRedirects[userRole]) {
      return NextResponse.redirect(new URL(roleRedirects[userRole], req.url))
    }
    // Default fallback
    return NextResponse.redirect(new URL('/dashboard/staff', req.url))
  }

  // If user is accessing /dashboard (root), redirect to role-specific dashboard
  // No one should access /dashboard directly - always redirect to role-specific page
  if (path === '/dashboard' && sessionToken && !isRoleDashboard) {
    if (userRole && roleRedirects[userRole]) {
      return NextResponse.redirect(new URL(roleRedirects[userRole], req.url))
    }
    // Default fallback - redirect to staff dashboard if role not found
    return NextResponse.redirect(new URL('/dashboard/staff', req.url))
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Check if user is trying to access a role-specific dashboard they don't have access to
  if (isRoleDashboard && sessionToken) {
    const requestedRole = path.split('/')[2] // Extract 'admin', 'staff', or 'technician' from '/dashboard/admin'
    
    // If the requested role doesn't match user's role, redirect to their proper dashboard
    if (userRole && requestedRole !== userRole) {
      if (roleRedirects[userRole]) {
        return NextResponse.redirect(new URL(roleRedirects[userRole], req.url))
      }
    }
  }

  return NextResponse.next()
}

// Routes where proxy should run
// Exclude API routes, static files, and images
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}