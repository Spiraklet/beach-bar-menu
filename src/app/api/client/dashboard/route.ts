import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
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

    return NextResponse.json({
      success: true,
      data: {
        menuItems,
        activeItems,
        qrCodes,
        todayOrders: todayOrders.length,
        todayRevenue,
        recentOrders,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
