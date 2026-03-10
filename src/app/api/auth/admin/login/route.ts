import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyPassword,
  createToken,
  setAuthCookie,
  checkRateLimit,
  recordLoginAttempt,
} from '@/lib/auth'
import { logLogin, logLoginFailed, getIpFromRequest } from '@/lib/audit'
import { apiSuccess, apiError, apiServerError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError('Email and password are required')
    }

    // Check rate limit with admin-specific config
    const rateLimit = await checkRateLimit(email, 'admin')
    if (!rateLimit.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429)
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    const ipAddress = getIpFromRequest(request.headers)

    if (!admin) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'ADMIN', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return apiError('Invalid credentials', 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.passwordHash)
    if (!isValid) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'ADMIN', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return apiError('Invalid credentials', 401)
    }

    // Create token and set cookie
    const token = await createToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    })

    await setAuthCookie(token, 'admin')
    await recordLoginAttempt(email, true)
    await logLogin({ actorType: 'ADMIN', actorId: admin.id, actorEmail: admin.email, ipAddress: ipAddress ?? undefined })

    return apiSuccess({ email: admin.email })
  } catch (error) {
    return apiServerError('Admin login error', error)
  }
}
