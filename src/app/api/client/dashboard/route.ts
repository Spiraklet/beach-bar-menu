import { prisma } from '@/lib/db'
import { withAuth, apiNotFound, apiSuccess } from '@/lib/api'

export const GET = withAuth('client', async (_request, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
  }

  // Get menu items count
  const [menuItems, activeItems] = await Promise.all([
    prisma.item.count({ where: { clientId: client.id } }),
    prisma.item.count({ where: { clientId: client.id, active: true } }),
  ])

  // Get QR codes count
  const qrCodes = await prisma.qRCode.count({
    where: { clientId: client.id },
  })

  // Get today's orders
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayOrders = await prisma.order.findMany({
    where: {
      clientId: client.id,
      createdAt: { gte: today },
    },
    include: {
      qrCode: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  )

  // Get recent orders (last 5)
  const recentOrders = todayOrders.slice(0, 5).map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total.toString(),
    tableIdentifier: order.qrCode.tableIdentifier,
    createdAt: order.createdAt.toISOString(),
  }))

  return apiSuccess({
    menuItems,
    activeItems,
    qrCodes,
    todayOrders: todayOrders.length,
    todayRevenue,
    recentOrders,
  })
})
