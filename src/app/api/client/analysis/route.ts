import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Set time bounds
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // Get all completed orders within date range
    const orders = await prisma.order.findMany({
      where: {
        clientId: user.id,
        status: 'COMPLETED',
        OR: [
          { doneAt: { gte: start, lte: end } },
          // Fallback to createdAt for orders without doneAt
          { doneAt: null, createdAt: { gte: start, lte: end } },
        ],
      },
      select: {
        id: true,
        total: true,
        doneAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by date
    const dailyStats: Record<string, { orders: number; revenue: number }> = {}

    orders.forEach((order) => {
      const date = order.doneAt || order.createdAt
      const dateKey = date.toISOString().split('T')[0]

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { orders: 0, revenue: 0 }
      }

      dailyStats[dateKey].orders += 1
      dailyStats[dateKey].revenue += Number(order.total)
    })

    // Convert to array and sort by date descending
    const stats = Object.entries(dailyStats)
      .map(([date, data]) => ({
        date,
        ordersCompleted: data.orders,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    // Calculate totals
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)

    return NextResponse.json({
      success: true,
      data: {
        stats,
        summary: {
          totalOrders,
          totalRevenue,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
