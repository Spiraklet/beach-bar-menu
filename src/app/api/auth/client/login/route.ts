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

    // Check rate limit with client-specific config
    const rateLimit = await checkRateLimit(email, 'client')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const ipAddress = getIpFromRequest(request.headers)

    // Find client
    const client = await prisma.client.findUnique({
      where: { email },
    })

    if (!client) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'CLIENT', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, client.passwordHash)
    if (!isValid) {
      await recordLoginAttempt(email, false)
      await logLoginFailed({ actorType: 'CLIENT', actorEmail: email, ipAddress: ipAddress ?? undefined })
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create token and set cookie
    const token = await createToken({
      id: client.id,
      email: client.email,
      role: 'client',
    })

    await setAuthCookie(token, 'client')
    await recordLoginAttempt(email, true)
    await logLogin({ actorType: 'CLIENT', actorId: client.id, actorEmail: client.email, clientId: client.id, ipAddress: ipAddress ?? undefined })

    return NextResponse.json({
      success: true,
      data: {
        clientId: client.clientId,
        companyName: client.companyName,
        email: client.email,
      },
    })
  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
