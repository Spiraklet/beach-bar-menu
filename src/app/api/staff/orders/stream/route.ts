import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token-staff')?.value

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'staff' || !payload.clientId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clientId = payload.clientId

  const encoder = new TextEncoder()
  let lastOrderIds: string[] = []
  let lastCompletedIds: string[] = []

  const stream = new ReadableStream({
    async start(controller) {
      const sendOrders = async () => {
        try {
          // Get active orders
          const orders = await prisma.order.findMany({
            where: {
              clientId,
              status: { in: ['NEW', 'PREPARING', 'READY'] },
            },
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

          // Get recent completed orders from today
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const recentCompleted = await prisma.order.findMany({
            where: {
              clientId,
              status: 'COMPLETED',
              OR: [
                { doneAt: { gte: today } },
                { createdAt: { gte: today } },
              ],
            },
            include: {
              qrCode: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
            orderBy: { doneAt: 'desc' },
            take: 5,
          })

          const currentOrderIds = orders.map((o) => o.id).sort()
          const currentCompletedIds = recentCompleted.map((o) => o.id).sort()

          const hasNewOrders =
            currentOrderIds.length !== lastOrderIds.length ||
            currentOrderIds.some((id, i) => id !== lastOrderIds[i])

          const hasNewCompleted =
            currentCompletedIds.length !== lastCompletedIds.length ||
            currentCompletedIds.some((id, i) => id !== lastCompletedIds[i])

          // Check for status changes (use createdAt as proxy since updatedAt was removed)
          const ordersChanged = orders.some((order) => {
            const prevOrder = lastOrderIds.includes(order.id)
            return !prevOrder || order.createdAt > new Date(Date.now() - 5000)
          })

          if (hasNewOrders || ordersChanged || hasNewCompleted) {
            const data = `data: ${JSON.stringify({ orders, recentCompleted })}\n\n`
            controller.enqueue(encoder.encode(data))
            lastOrderIds = currentOrderIds
            lastCompletedIds = currentCompletedIds
          }
        } catch (error) {
          console.error('Staff SSE error:', error)
        }
      }

      // Send initial data immediately
      await sendOrders()

      // Poll for updates every 3 seconds
      const interval = setInterval(sendOrders, 3000)

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
