import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ============================================================================
// JWT SECRET - Must match auth.ts
// ============================================================================
const JWT_SECRET_STRING = process.env.JWT_SECRET
if (!JWT_SECRET_STRING) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set')
}
const JWT_SECRET = JWT_SECRET_STRING
  ? new TextEncoder().encode(JWT_SECRET_STRING)
  : null

async function verifyTokenMiddleware(token: string) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET not available for token verification')
    return null
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; email: string; role: 'admin' | 'client' | 'staff'; clientId?: string }
  } catch {
    return null
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Disable XSS filter (modern browsers don't need it, can cause issues)
  response.headers.set('X-XSS-Protection', '0')

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Next.js requires unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'; " + // Tailwind uses inline styles
    "img-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  )

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - disable unnecessary features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS - Only enable if explicitly configured (requires HTTPS to be working)
  if (process.env.ENABLE_HSTS === 'true') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

// ============================================================================
// HTTPS REDIRECT
// ============================================================================
function shouldRedirectToHttps(request: NextRequest): boolean {
  // Only in production
  if (process.env.NODE_ENV !== 'production') {
    return false
  }

  // Check X-Forwarded-Proto header (set by load balancers/proxies)
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedProto === 'http') {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // HTTPS redirect check
  if (shouldRedirectToHttps(request)) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // Public routes - no auth needed
  const publicRoutes = [
    '/admin/login',
    '/login',
    '/api/auth',
  ]

  // Check if it's a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Staff login pages are public (pattern: /staff/[token]/login)
  if (/^\/staff\/[a-z0-9]+\/login/.test(pathname)) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Customer routes are public (starts with /[clientId])
  // Match pattern like /1234/A1 (4-digit client ID, table identifier)
  if (/^\/\d{4}\/[A-Za-z0-9]+/.test(pathname)) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // API routes for customer ordering
  if (pathname.startsWith('/api/orders') && request.method === 'POST') {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  if (pathname.startsWith('/api/menu')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Determine which cookie to check based on the route
  let token: string | undefined
  let expectedRole: 'admin' | 'client' | 'staff' | null = null

  if (pathname.startsWith('/admin')) {
    token = request.cookies.get('auth-token-admin')?.value
    expectedRole = 'admin'
  } else if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/menu') ||
    pathname.startsWith('/qr-codes') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/staff-settings') ||
    pathname.startsWith('/analysis')
  ) {
    token = request.cookies.get('auth-token-client')?.value
    expectedRole = 'client'
  } else if (/^\/staff\/[a-z0-9]+\/orders/.test(pathname)) {
    token = request.cookies.get('auth-token-staff')?.value
    expectedRole = 'staff'
  }

  // If no specific route matched requiring auth, allow through
  if (!expectedRole) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  if (!token) {
    // Redirect to appropriate login page
    if (expectedRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (expectedRole === 'staff') {
      const match = pathname.match(/^\/staff\/([a-z0-9]+)/)
      const urlToken = match ? match[1] : ''
      return NextResponse.redirect(new URL(`/staff/${urlToken}/login`, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  const payload = await verifyTokenMiddleware(token)

  if (!payload) {
    // Clear invalid cookie and redirect
    let redirectUrl = '/login'
    if (expectedRole === 'admin') {
      redirectUrl = '/admin/login'
    } else if (expectedRole === 'staff') {
      const match = pathname.match(/^\/staff\/([a-z0-9]+)/)
      const urlToken = match ? match[1] : ''
      redirectUrl = `/staff/${urlToken}/login`
    }
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.cookies.delete(`auth-token-${expectedRole}`)
    return response
  }

  // Check role matches expected role
  if (payload.role !== expectedRole) {
    // Redirect to appropriate login page for the expected role
    if (expectedRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (expectedRole === 'staff') {
      const match = pathname.match(/^\/staff\/([a-z0-9]+)/)
      const urlToken = match ? match[1] : ''
      return NextResponse.redirect(new URL(`/staff/${urlToken}/login`, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
