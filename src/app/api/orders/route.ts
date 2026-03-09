import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
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
    const { clientId, tableId, token, items, customerNote } = body as {
      clientId: string
      tableId: string
      token: string
      items: CreateOrderInput['items']
      customerNote?: string
    }

    if (!clientId || !tableId || !token || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Client ID, table ID, security token, and items are required' },
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

    if (!qrCode || qrCode.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Invalid table' },
        { status: 404 }
      )
    }

    // Validate security token
    if (qrCode.token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired QR code' },
        { status: 403 }
      )
    }

    // Rate limiting: check orders this hour
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const MAX_ORDERS_PER_HOUR = 10
    const MAX_PENDING_ORDERS = 3

    // Reset hourly counter if the window has passed
    if (qrCode.hourResetAt < oneHourAgo) {
      await prisma.qRCode.update({
        where: { id: qrCode.id },
        data: { ordersThisHour: 0, hourResetAt: now },
      })
      qrCode.ordersThisHour = 0
    }

    if (qrCode.ordersThisHour >= MAX_ORDERS_PER_HOUR) {
      return NextResponse.json(
        { success: false, error: 'Too many orders from this table. Please wait.' },
        { status: 429 }
      )
    }

    if (qrCode.pendingOrdersCount >= MAX_PENDING_ORDERS) {
      return NextResponse.json(
        { success: false, error: 'You have pending orders. Please wait for them to be prepared.' },
        { status: 429 }
      )
    }

    // Fetch all items to calculate totals (deduplicate IDs for the query)
    const itemIds = items.map((i) => i.itemId)
    const uniqueItemIds = Array.from(new Set(itemIds))
    const menuItems = await prisma.item.findMany({
      where: {
        id: { in: uniqueItemIds },
        clientId: client.id,
        active: true,
      },
    })

    if (menuItems.length !== uniqueItemIds.length) {
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
        note: orderItem.note || null,
        // Snapshot fields - preserve item details at time of order
        itemNameSnapshot: menuItem.name,
        itemPriceSnapshot: Number(menuItem.price),
      }
    })

    // Generate display code and secure view token
    const { dailySequence, sequenceDate, displayCode } = await generateOrderDisplayCode(client.id, client.clientId, tableId)
    const viewToken = randomBytes(16).toString('hex')

    // Create order (without viewToken in Prisma data — set via raw SQL below for reliability)
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

    // Set view_token via raw SQL — guarantees it is stored regardless of Prisma client version
    await prisma.$executeRaw`UPDATE orders SET view_token = ${viewToken} WHERE id = ${order.id}`

    // Update rate limiting counters
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        ordersThisHour: { increment: 1 },
        lastOrderAt: now,
        pendingOrdersCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        orderNumber: order.displayCode,
        viewToken, // use the pre-generated variable, never order.viewToken (may be null on old clients)
      },
    }, { status: 201 })
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

    // Decrement pending order count when order is completed or cancelled
    if (['COMPLETED', 'CANCELLED'].includes(status)) {
      await prisma.qRCode.update({
        where: { id: order.qrCodeId },
        data: { pendingOrdersCount: { decrement: 1 } },
      })
    }

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
