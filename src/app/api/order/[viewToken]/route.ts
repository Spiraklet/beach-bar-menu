import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email'

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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Get order by token error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Save customer email
    await prisma.order.update({
      where: { viewToken },
      data: { customerEmail: email },
    })

    // Send confirmation email
    await sendOrderConfirmation(email, order)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send order confirmation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}
