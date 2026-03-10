import { NextRequest, NextResponse } from 'next/server'
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
    const { token, password } = body

    if (!token || !password) {
      return apiError('Token and password are required')
    }

    // Find staff settings by token
    const staffSettings = await prisma.staffSettings.findUnique({
      where: { staffToken: token },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            companyName: true,
          },
        },
      },
    })

    if (!staffSettings) {
      return apiError('Invalid access link', 401)
    }

    // Use a unique identifier for rate limiting (staff token)
    const rateLimitKey = `staff:${token}`

    // Check rate limit with staff-specific config
    const { allowed, remainingAttempts } = await checkRateLimit(rateLimitKey, 'staff')
    if (!allowed) {
      return apiError('Too many login attempts. Please try again later.', 429)
    }

    const ipAddress = getIpFromRequest(request.headers)
    const staffEmail = `staff@${staffSettings.client.companyName.toLowerCase().replace(/\s+/g, '')}`

    // Verify password
    const isValid = await verifyPassword(password, staffSettings.staffPasswordHash)

    if (!isValid) {
      await recordLoginAttempt(rateLimitKey, false)
      await logLoginFailed({ actorType: 'STAFF', actorEmail: staffEmail, ipAddress: ipAddress ?? undefined })
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password',
          remainingAttempts: remainingAttempts - 1,
        },
        { status: 401 }
      )
    }

    // Record successful login
    await recordLoginAttempt(rateLimitKey, true)

    // Create JWT token with staff role
    const jwtToken = await createToken({
      id: staffSettings.id, // Staff settings ID
      email: staffEmail,
      role: 'staff',
      clientId: staffSettings.client.id,
    })

    // Set auth cookie
    await setAuthCookie(jwtToken, 'staff')
    await logLogin({ actorType: 'STAFF', actorId: staffSettings.id, actorEmail: staffEmail, clientId: staffSettings.client.id, ipAddress: ipAddress ?? undefined })

    return apiSuccess({
      companyName: staffSettings.client.companyName,
      staffToken: token,
    })
  } catch (error) {
    return apiServerError('Staff login error', error)
  }
}
