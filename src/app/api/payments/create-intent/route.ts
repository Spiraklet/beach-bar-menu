import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createPaymentIntent } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (!order.client.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant has not set up payments yet' },
        { status: 400 }
      )
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

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: amountInCents,
      },
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
