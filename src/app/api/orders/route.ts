import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { CreateOrderInput } from '@/types'

// Generate daily sequence and display code for a client
async function generateOrderDisplayCode(clientId: string, clientCode: string, tableId: string): Promise<{ dailySequence: number; sequenceDate: Date; displayCode: string }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastOrder = await prisma.order.findFirst({
    where: {
      clientId,
      sequenceDate: today,
    },
    orderBy: { dailySequence: 'desc' },
    select: { dailySequence: true },
  })

  const dailySequence = lastOrder ? lastOrder.dailySequence + 1 : 1
  const displayCode = `${clientCode}-${tableId}-${String(dailySequence).padStart(4, '0')}`

  return { dailySequence, sequenceDate: today, displayCode }
}

// GET orders (for client dashboard)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const whereClause: Record<string, unknown> = { clientId: user.id }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      whereClause.createdAt = { gte: startDate, lte: endDate }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        qrCode: true,
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new order (from customer)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, tableId, items, customerNote } = body as {
      clientId: string
      tableId: string
      items: CreateOrderInput['items']
      customerNote?: string
    }

    if (!clientId || !tableId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Client ID, table ID, and items are required' },
        { status: 400 }
      )
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { clientId },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Find QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        clientId_tableIdentifier: {
          clientId: client.id,
          tableIdentifier: tableId,
        },
      },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid table' },
        { status: 404 }
      )
    }

    // Fetch all items to calculate totals
    const itemIds = items.map((i) => i.itemId)
    const menuItems = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        clientId: client.id,
        active: true,
      },
      include: {
        customizations: true,
      },
    })

    if (menuItems.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some items are no longer available' },
        { status: 400 }
      )
    }

    // Calculate order total
    let orderTotal = 0
    const orderItems = items.map((orderItem) => {
      const menuItem = menuItems.find((m) => m.id === orderItem.itemId)!
      let itemSubtotal = Number(menuItem.price) * orderItem.quantity

      // Add customization prices
      if (orderItem.customizations) {
        for (const cust of orderItem.customizations) {
          itemSubtotal += cust.price * orderItem.quantity
        }
      }

      orderTotal += itemSubtotal

      return {
        item: { connect: { id: orderItem.itemId } },
        quantity: orderItem.quantity,
        customizations: orderItem.customizations && orderItem.customizations.length > 0
          ? JSON.parse(JSON.stringify(orderItem.customizations))
          : undefined,
        subtotal: itemSubtotal,
        // Snapshot fields - preserve item details at time of order
        itemNameSnapshot: menuItem.name,
        itemPriceSnapshot: Number(menuItem.price),
      }
    })

    // Generate display code
    const { dailySequence, sequenceDate, displayCode } = await generateOrderDisplayCode(client.id, client.clientId, tableId)

    // Create order
    const order = await prisma.order.create({
      data: {
        client: { connect: { id: client.id } },
        qrCode: { connect: { id: qrCode.id } },
        displayCode,
        dailySequence,
        sequenceDate,
        total: orderTotal,
        customerNote: customerNote || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        qrCode: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update order status
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
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Verify order belongs to client
    const order = await prisma.order.findFirst({
      where: { id, clientId: user.id },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { doneAt: new Date() } : {}),
      },
      include: {
        qrCode: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
