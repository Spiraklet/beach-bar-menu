import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { withAuth, apiError, apiNotFound, apiSuccess, apiServerError } from '@/lib/api'
import { VALID_ORDER_STATUSES } from '@/lib/order-status'
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
export const GET = withAuth('client', async (request: NextRequest, user) => {
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

  return apiSuccess(orders)
})

// POST create new order (from customer) — PUBLIC, no auth wrapper
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
      return apiError('Client ID, table ID, security token, and items are required')
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { clientId },
    })

    if (!client) {
      return apiNotFound('Restaurant')
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
      return apiNotFound('Invalid table')
    }

    // Validate security token
    if (qrCode.token !== token) {
      return apiError('Invalid or expired QR code', 403)
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
      return apiError('Too many orders from this table. Please wait.', 429)
    }

    if (qrCode.pendingOrdersCount >= MAX_PENDING_ORDERS) {
      return apiError('You have pending orders. Please wait for them to be prepared.', 429)
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
      return apiError('Some items are no longer available')
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

    return apiSuccess({
      ...order,
      orderNumber: order.displayCode,
      viewToken, // use the pre-generated variable, never order.viewToken (may be null on old clients)
    }, 201)
  } catch (error) {
    return apiServerError('Create order error', error)
  }
}

// PATCH update order status
export const PATCH = withAuth('client', async (request: NextRequest, user) => {
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return apiError('Order ID and status are required')
  }

  if (!VALID_ORDER_STATUSES.includes(status)) {
    return apiError('Invalid status')
  }

  // Verify order belongs to client
  const order = await prisma.order.findFirst({
    where: { id, clientId: user.id },
  })

  if (!order) {
    return apiNotFound('Order')
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

  return apiSuccess(updatedOrder)
})
