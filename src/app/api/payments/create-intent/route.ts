import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createPaymentIntent } from '@/lib/stripe'
import { withAuth, apiError, apiNotFound, apiSuccess } from '@/lib/api'

export const POST = withAuth('client', async (request: NextRequest) => {
  const body = await request.json()
  const { orderId } = body

  if (!orderId) {
    return apiError('Order ID is required')
  }

  // Get order with client info
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      qrCode: true,
    },
  })

  if (!order) {
    return apiNotFound('Order')
  }

  if (!order.client.stripeAccountId) {
    return apiError('Restaurant has not set up payments yet')
  }

  // Create payment intent (amount in cents)
  const amountInCents = Math.round(Number(order.total) * 100)

  const paymentIntent = await createPaymentIntent(
    amountInCents,
    order.client.stripeAccountId,
    {
      orderId: order.id,
      clientId: order.clientId,
      tableId: order.qrCode.tableIdentifier,
    }
  )

  // Update order with payment intent ID
  await prisma.order.update({
    where: { id: orderId },
    data: { stripePaymentId: paymentIntent.id },
  })

  return apiSuccess({
    clientSecret: paymentIntent.client_secret,
    amount: amountInCents,
  })
})
