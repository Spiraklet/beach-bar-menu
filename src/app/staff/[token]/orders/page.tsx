'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Modal, Toast } from '@/components/ui'
import { useToast } from '@/hooks'
import { formatPrice, formatDate } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { ORDER_STATUS_COLORS as statusColors, ORDER_STATUS_LABELS as statusLabels, NEXT_ORDER_STATUS as nextStatus } from '@/lib/order-status'
import type { Order, OrderStatus } from '@/types'

// ─── Web Audio notification chime ───
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    // First tone (lower)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.15)

    // Second tone (higher)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.12)
    osc2.stop(ctx.currentTime + 0.35)

    // Third tone (highest, short)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.28) // D6
    gain3.gain.setValueAtTime(0, ctx.currentTime)
    gain3.gain.setValueAtTime(0.25, ctx.currentTime + 0.28)
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.start(ctx.currentTime + 0.28)
    osc3.stop(ctx.currentTime + 0.5)

    // Clean up
    setTimeout(() => ctx.close(), 600)
  } catch {
    // AudioContext not available — fail silently
  }
}

export default function StaffOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [orders, setOrders] = useState<Order[]>([])
  const [recentCompleted, setRecentCompleted] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'history'>('active')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { toast, showToast, dismissToast } = useToast()
  const [headerFlash, setHeaderFlash] = useState(false)

  // Notification state — auto-enabled after first user interaction
  const [notificationsReady, setNotificationsReady] = useState(false)
  const previousOrderIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  // Auto-enable notifications on first user interaction (required by browsers)
  useEffect(() => {
    const enableOnInteraction = () => {
      setNotificationsReady(true)
      window.removeEventListener('click', enableOnInteraction)
      window.removeEventListener('touchstart', enableOnInteraction)
      window.removeEventListener('keydown', enableOnInteraction)
    }
    window.addEventListener('click', enableOnInteraction)
    window.addEventListener('touchstart', enableOnInteraction)
    window.addEventListener('keydown', enableOnInteraction)
    return () => {
      window.removeEventListener('click', enableOnInteraction)
      window.removeEventListener('touchstart', enableOnInteraction)
      window.removeEventListener('keydown', enableOnInteraction)
    }
  }, [])

  // SSE connection for real-time updates
  useEffect(() => {
    if (filter !== 'active') return

    const eventSource = new EventSource('/api/staff/orders/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const newOrders: Order[] = data.orders
      const newRecentCompleted: Order[] = data.recentCompleted || []

      // Detect genuinely new orders (by ID, not just count)
      const newOrderIds = new Set(newOrders.map(o => o.id))
      if (!isFirstLoadRef.current && notificationsReady) {
        const brandNewOrders = newOrders.filter(o => !previousOrderIdsRef.current.has(o.id) && o.status === 'NEW')
        if (brandNewOrders.length > 0) {
          playNotificationSound()
          // Visual flash
          setHeaderFlash(true)
          setTimeout(() => setHeaderFlash(false), 1500)
          showToast(`🔔 New order from Table ${brandNewOrders[0].qrCode?.tableIdentifier || '?'}!`, 'info')
        }
      }

      previousOrderIdsRef.current = newOrderIds
      isFirstLoadRef.current = false
      setOrders(newOrders)
      setRecentCompleted(newRecentCompleted)
      setIsLoading(false)
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [filter, notificationsReady])

  // Fetch all orders for history view
  const fetchAllOrders = useCallback(async () => {
    try {
      const data = await api.get('/api/staff/orders')

      if (data.success) {
        setAllOrders(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (filter === 'history') {
      fetchAllOrders()
    }
  }, [filter, fetchAllOrders])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const data = await api.patch('/api/staff/orders', { id: orderId, status })

      if (data.success) {
        showToast(`Order marked as ${statusLabels[status]}`, 'success')
        setSelectedOrder(null)

        // Update local state
        if (filter === 'active') {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          )
        } else {
          fetchAllOrders()
        }
      } else {
        showToast('Failed to update order', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
    }
  }

  const copyOrderDetails = async (order: Order) => {
    const items = order.items?.map((item) => {
      let text = `${item.quantity}x ${item.item?.name}`
      if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
        text += ` (${item.customizations.map((c) => c.name).join(', ')})`
      }
      return text
    }).join('\n')

    const text = `Order #${order.orderNumber || order.displayCode || 'N/A'}
Table: ${order.qrCode?.tableIdentifier}
Time: ${formatDate(order.createdAt)}

Items:
${items}
${order.customerNote ? `\nNote: ${order.customerNote}` : ''}
Total: ${formatPrice(order.total)}`

    try {
      await navigator.clipboard.writeText(text)
      showToast('Order details copied!', 'success')
    } catch {
      showToast('Failed to copy', 'error')
    }
  }

  // Helper: short order label (daily sequence or last segment of displayCode)
  const orderLabel = (order: Order | null) => {
    if (!order) return ''
    if (order.dailySequence) return `#${order.dailySequence}`
    if (order.orderNumber) return `#${order.orderNumber}`
    if (order.displayCode) return `#${order.displayCode}`
    return ''
  }

  // Group orders by table for active view
  const groupedByTable = orders.reduce((acc, order) => {
    const tableId = order.qrCode?.tableIdentifier || 'Unknown'
    if (!acc[tableId]) {
      acc[tableId] = []
    }
    acc[tableId].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  // Sort tables by earliest order time (most urgent first)
  const sortedTables = Object.entries(groupedByTable).sort((a, b) => {
    const aEarliest = Math.min(...a[1].map(o => new Date(o.createdAt).getTime()))
    const bEarliest = Math.min(...b[1].map(o => new Date(o.createdAt).getTime()))
    return aEarliest - bEarliest
  })

  const handleLogout = async () => {
    await api.post('/api/auth/logout')
    router.push(`/staff/${token}/login`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — flashes on new order */}
      <header
        className={`shadow-sm sticky top-0 z-40 transition-colors duration-500 ${
          headerFlash ? 'bg-blue-100' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-500 ${
              headerFlash ? 'bg-blue-600' : 'bg-primary-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Staff Portal</h1>
              <p className="text-sm text-gray-500">
                Order Management
                {notificationsReady && (
                  <span className="ml-2 text-green-600" title="Sound notifications active">🔔</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 border-t">
          <nav className="flex gap-1">
            <span
              className="px-4 py-3 text-sm font-medium text-primary-600 border-b-2 border-primary-600"
            >
              Orders
            </span>
            <a
              href={`/staff/${token}/menu`}
              className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Menu
            </a>
          </nav>
        </div>
      </header>

      {/* Notification hint banner — shown until user interacts */}
      {!notificationsReady && filter === 'active' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-sm text-amber-800">
            👆 Tap anywhere to enable sound notifications for new orders
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <p className="text-gray-600">
              {filter === 'active'
                ? `${orders.length} active orders`
                : `${allOrders.length} total orders`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'active'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Active Orders
              </button>
              <button
                onClick={() => setFilter('history')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'history'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Order History
              </button>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : filter === 'active' && orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
            <p className="text-gray-500">No active orders</p>
          </div>
        ) : filter === 'history' && allOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : filter === 'active' ? (
          /* Grouped by Table View for Active Orders */
          <div className="space-y-6">
            {sortedTables.map(([tableId, tableOrders]) => (
              <div key={tableId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary-600">{tableId}</span>
                    <span className="text-sm text-gray-500">
                      {tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(tableOrders[0].createdAt)}
                  </span>
                </div>

                {/* Orders for this table */}
                <div className="divide-y">
                  {tableOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        index === 0 && order.status === 'NEW' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">
                            {orderLabel(order)}
                          </span>
                          <span className={`badge ${statusColors[order.status as OrderStatus]}`}>
                            {statusLabels[order.status as OrderStatus]}
                          </span>
                        </div>
                        <span className="font-semibold text-primary-600">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        {order.items?.slice(0, 3).map((orderItem) => (
                          <div key={orderItem.id} className="text-sm text-gray-600">
                            {orderItem.quantity}x {orderItem.item?.name}
                            {orderItem.customizations && Array.isArray(orderItem.customizations) && orderItem.customizations.length > 0 && (
                              <span className="text-gray-400 ml-1">
                                ({orderItem.customizations.map((c) => c.name).join(', ')})
                              </span>
                            )}
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-sm text-gray-400">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      {order.customerNote && (
                        <p className="text-sm text-gray-500 italic mb-2 truncate">
                          Note: {order.customerNote}
                        </p>
                      )}

                      {nextStatus[order.status as OrderStatus] && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, nextStatus[order.status as OrderStatus]!)
                          }}
                        >
                          {order.status === 'NEW' ? 'Prepare' : order.status === 'PREPARING' ? 'Ready' : 'Done'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Recently Completed Section */}
            {recentCompleted.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Recently Completed Today</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentCompleted.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow opacity-75"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Table {order.qrCode?.tableIdentifier}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {orderLabel(order)} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span className={`badge ${statusColors[order.status as OrderStatus]}`}>
                          {statusLabels[order.status as OrderStatus]}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {order.items?.slice(0, 2).map((orderItem) => (
                          <div key={orderItem.id} className="text-sm text-gray-600">
                            {orderItem.quantity}x {orderItem.item?.name}
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-sm text-gray-400">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="font-semibold text-gray-500">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* History View - Original Grid */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                  order.status === 'NEW' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Table {order.qrCode?.tableIdentifier}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {orderLabel(order)} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`badge ${statusColors[order.status as OrderStatus]}`}>
                    {statusLabels[order.status as OrderStatus]}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.slice(0, 3).map((orderItem) => (
                    <div key={orderItem.id} className="text-sm text-gray-600">
                      {orderItem.quantity}x {orderItem.item?.name}
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <p className="text-sm text-gray-400">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>

                {order.customerNote && (
                  <p className="text-sm text-gray-500 italic mb-3 truncate">
                    Note: {order.customerNote}
                  </p>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold text-primary-600">
                    {formatPrice(order.total)}
                  </span>
                  {nextStatus[order.status as OrderStatus] && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateOrderStatus(order.id, nextStatus[order.status as OrderStatus]!)
                      }}
                    >
                      {order.status === 'NEW' ? 'Prepare' : order.status === 'PREPARING' ? 'Ready' : 'Done'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${orderLabel(selectedOrder)} — Table ${selectedOrder?.qrCode?.tableIdentifier}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`badge ${statusColors[selectedOrder.status as OrderStatus]}`}>
                {statusLabels[selectedOrder.status as OrderStatus]}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(selectedOrder.createdAt)}
              </span>
            </div>

            <div className="border rounded-lg divide-y">
              {selectedOrder.items?.map((orderItem) => (
                <div key={orderItem.id} className="p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {orderItem.quantity}x {orderItem.item?.name}
                    </span>
                    <span>{formatPrice(orderItem.subtotal)}</span>
                  </div>
                  {orderItem.customizations && Array.isArray(orderItem.customizations) && orderItem.customizations.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {orderItem.customizations.map((c) => c.name).join(', ')}
                    </p>
                  )}
                  {orderItem.note && (
                    <p className="text-xs text-amber-600 mt-1 italic">📝 {orderItem.note}</p>
                  )}
                </div>
              ))}
            </div>

            {selectedOrder.customerNote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">Customer Note:</p>
                <p className="text-sm text-yellow-700 mt-1">{selectedOrder.customerNote}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(selectedOrder.total)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 flex-wrap">
              <Button
                variant="secondary"
                onClick={() => copyOrderDetails(selectedOrder)}
              >
                Copy Details
              </Button>
              {nextStatus[selectedOrder.status as OrderStatus] && (
                <Button
                  className="flex-1"
                  onClick={() =>
                    updateOrderStatus(
                      selectedOrder.id,
                      nextStatus[selectedOrder.status as OrderStatus]!
                    )
                  }
                >
                  Mark as {statusLabels[nextStatus[selectedOrder.status as OrderStatus]!]}
                </Button>
              )}
              {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && (
                <Button
                  variant="danger"
                  onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELLED')}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      )}
    </div>
  )
}
