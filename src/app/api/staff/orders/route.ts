import { prisma } from '@/lib/db'
import { withStaffAuth, apiSuccess, apiError, apiNotFound } from '@/lib/api'
import { VALID_ORDER_STATUSES } from '@/lib/order-status'

// GET orders for staff user
export const GET = withStaffAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const whereClause: Record<string, unknown> = { clientId: payload.clientId }

  if (status && status !== 'all') {
    whereClause.status = status
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

// PATCH update order status (staff can update orders)
export const PATCH = withStaffAuth(async (request, payload) => {
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return apiError('Order ID and status are required')
  }

  if (!VALID_ORDER_STATUSES.includes(status)) {
    return apiError('Invalid status')
  }

  // Verify order belongs to the staff's client
  const order = await prisma.order.findFirst({
    where: { id, clientId: payload.clientId },
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
