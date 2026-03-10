import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email'
import { apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/api'

// GET - fetch order by viewToken (no auth needed, token is the credential)
export async function GET(
  _request: NextRequest,
  { params }: { params: { viewToken: string } }
) {
  try {
    const { viewToken } = params

    const order = await prisma.order.findUnique({
      where: { viewToken },
      select: {
        id: true,
        displayCode: true,
        status: true,
        total: true,
        customerNote: true,
        customerEmail: true,
        createdAt: true,
        client: {
          select: { companyName: true },
        },
        qrCode: {
          select: { tableIdentifier: true },
        },
        items: {
          select: {
            id: true,
            itemNameSnapshot: true,
            itemPriceSnapshot: true,
            quantity: true,
            customizations: true,
            subtotal: true,
          },
        },
      },
    })

    if (!order) {
      return apiNotFound('Order')
    }

    return apiSuccess(order)
  } catch (error) {
    return apiServerError('Get order by token error', error)
  }
}

// POST - save customer email and send confirmation
export async function POST(
  request: NextRequest,
  { params }: { params: { viewToken: string } }
) {
  try {
    const { viewToken } = params
    const body = await request.json()
    const { email } = body as { email: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError('A valid email address is required')
    }

    const order = await prisma.order.findUnique({
      where: { viewToken },
      select: {
        id: true,
        displayCode: true,
        status: true,
        total: true,
        customerNote: true,
        createdAt: true,
        client: {
          select: { companyName: true },
        },
        qrCode: {
          select: { tableIdentifier: true },
        },
        items: {
          select: {
            itemNameSnapshot: true,
            itemPriceSnapshot: true,
            quantity: true,
            customizations: true,
            subtotal: true,
          },
        },
      },
    })

    if (!order) {
      return apiNotFound('Order')
    }

    // Save customer email
    await prisma.order.update({
      where: { viewToken },
      data: { customerEmail: email },
    })

    // Send confirmation email
    await sendOrderConfirmation(email, order)

    return apiSuccess()
  } catch (error) {
    return apiServerError('Send order confirmation error', error)
  }
}
