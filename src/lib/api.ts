import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, verifyToken, type TokenPayload, type AuthRole } from './auth'

// ============================================================================
// RESPONSE HELPERS — Standardize API response format
// ============================================================================

export function apiSuccess<T>(data?: T, status = 200) {
  return NextResponse.json(
    { success: true, ...(data !== undefined ? { data } : {}) },
    { status }
  )
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function apiUnauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  )
}

export function apiNotFound(entity = 'Resource') {
  return NextResponse.json(
    { success: false, error: `${entity} not found` },
    { status: 404 }
  )
}

export function apiServerError(logLabel: string, error: unknown) {
  console.error(`${logLabel}:`, error)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// ============================================================================
// AUTH WRAPPERS — Eliminate repeated auth + try/catch boilerplate
// ============================================================================

type AuthenticatedHandler = (
  request: NextRequest,
  user: TokenPayload
) => Promise<NextResponse | Response>

type PublicHandler = (
  request: NextRequest
) => Promise<NextResponse | Response>

/**
 * Wraps a route handler with role-based auth (using cookies() / getCurrentUser).
 * Handles auth check + try/catch automatically.
 *
 * Usage:
 *   export const GET = withAuth('client', async (request, user) => {
 *     // user is guaranteed authenticated with correct role
 *     return apiSuccess({ data })
 *   })
 */
export function withAuth(role: AuthRole, handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser(role)
      if (!user || user.role !== role) {
        return apiUnauthorized()
      }
      return await handler(request, user)
    } catch (error) {
      return apiServerError(`${role} route error`, error)
    }
  }
}

/**
 * Wraps a route handler with staff auth (reads cookie directly from request).
 * Needed for staff routes that use request.cookies instead of cookies().
 *
 * Usage:
 *   export const GET = withStaffAuth(async (request, payload) => {
 *     // payload.clientId is guaranteed to exist
 *     return apiSuccess({ data })
 *   })
 */
export function withStaffAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      const token = request.cookies.get('auth-token-staff')?.value
      if (!token) return apiUnauthorized()

      const payload = await verifyToken(token)
      if (!payload || payload.role !== 'staff' || !payload.clientId) {
        return apiUnauthorized()
      }
      return await handler(request, payload)
    } catch (error) {
      return apiServerError('Staff route error', error)
    }
  }
}

/**
 * Wraps a public route handler with try/catch only (no auth).
 * Useful for public endpoints that still need consistent error handling.
 *
 * Usage:
 *   export const GET = withPublicHandler(async (request) => {
 *     return apiSuccess({ data })
 *   })
 */
export function withPublicHandler(handler: PublicHandler) {
  return async (request: NextRequest) => {
    try {
      return await handler(request)
    } catch (error) {
      return apiServerError('Route error', error)
    }
  }
}
