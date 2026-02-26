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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check rate limit with admin-specific config
    const rateLimit = await checkRateLimit(email, 'admin')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    const ipAddress = getIpFromRequest(request.headers)

    if (!admin) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'ADMIN', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.passwordHash)
    if (!isValid) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'ADMIN', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
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

    return NextResponse.json({
      success: true,
      data: { email: admin.email },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
