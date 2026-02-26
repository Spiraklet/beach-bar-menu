import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, hashPassword, validateClientPassword } from '@/lib/auth'
import { createAccountLink, getAccountStatus } from '@/lib/stripe'

// GET client settings
export async function GET() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        clientId: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        email: true,
        stripeAccountId: true,
        createdAt: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get Stripe account status if connected
    let stripeStatus = null
    if (client.stripeAccountId) {
      try {
        stripeStatus = await getAccountStatus(client.stripeAccountId)
      } catch (error) {
        console.error('Failed to get Stripe status:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        stripeStatus,
      },
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update client settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { companyName, contactPerson, phone, password } = body

    const updateData: Record<string, string> = {}

    if (companyName) updateData.companyName = companyName
    if (contactPerson) updateData.contactPerson = contactPerson
    if (phone) updateData.phone = phone

    if (password) {
      const validation = validateClientPassword(password)
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
      updateData.passwordHash = await hashPassword(password)
    }

    const client = await prisma.client.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        clientId: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        email: true,
        stripeAccountId: true,
      },
    })

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST connect Stripe account
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create Stripe Connect account link
    const { action } = await request.json()

    if (action === 'connect') {
      // Create new Stripe account if not exists
      if (!client.stripeAccountId) {
        const stripe = await import('@/lib/stripe')
        const accountId = await stripe.createConnectAccount(
          client.email,
          client.companyName
        )

        await prisma.client.update({
          where: { id: user.id },
          data: { stripeAccountId: accountId },
        })

        const accountLink = await createAccountLink(accountId)
        return NextResponse.json({ success: true, data: { url: accountLink } })
      } else {
        // Generate new account link for existing account
        const accountLink = await createAccountLink(client.stripeAccountId)
        return NextResponse.json({ success: true, data: { url: accountLink } })
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Stripe connect error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to connect Stripe' },
      { status: 500 }
    )
  }
}
