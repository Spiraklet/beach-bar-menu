import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, validateClientPassword } from '@/lib/auth'
import { createAccountLink, getAccountStatus } from '@/lib/stripe'
import { withAuth, apiError, apiNotFound, apiSuccess } from '@/lib/api'

// GET client settings
export const GET = withAuth('client', async (_request, user) => {
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
    return apiNotFound('Client')
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

  return apiSuccess({
    ...client,
    stripeStatus,
  })
})

// PATCH update client settings
export const PATCH = withAuth('client', async (request: NextRequest, user) => {
  const body = await request.json()
  const { companyName, contactPerson, phone, password } = body

  const updateData: Record<string, string> = {}

  if (companyName) updateData.companyName = companyName
  if (contactPerson) updateData.contactPerson = contactPerson
  if (phone) updateData.phone = phone

  if (password) {
    const validation = validateClientPassword(password)
    if (!validation.valid) {
      return apiError(validation.errors.join(', '))
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

  return apiSuccess(client)
})

// POST connect Stripe account
export const POST = withAuth('client', async (request: NextRequest, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
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
      return apiSuccess({ url: accountLink })
    } else {
      // Generate new account link for existing account
      const accountLink = await createAccountLink(client.stripeAccountId)
      return apiSuccess({ url: accountLink })
    }
  }

  return apiError('Invalid action')
})
