'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import { Button, Modal, Toast, ToastType } from '@/components/ui'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const statusColors: Record<OrderStatus, string> = {
  NEW: 'badge-new',
  PREPARING: 'badge-preparing',
  READY: 'badge-ready',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
}

const statusLabels: Record<OrderStatus, string> = {
  NEW: 'New',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  NEW: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousOrderCount = useRef(0)

  // SSE connection for real-time updates
  useEffect(() => {
    if (filter !== 'active') return

    const eventSource = new EventSource('/api/orders/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const newOrders = data.orders

      // Check for new orders
      if (
        isNotificationEnabled &&
        newOrders.length > previousOrderCount.current &&
        previousOrderCount.current > 0
      ) {
        // Play notification sound
        audioRef.current?.play()
        setToast({ message: 'New order received!', type: 'info' })
      }

      previousOrderCount.current = newOrders.length
      setOrders(newOrders)
      setIsLoading(false)
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [filter, isNotificationEnabled])

  // Fetch all orders for history view
  const fetchAllOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()

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
    if (filter === 'all') {
      fetchAllOrders()
    }
  }, [filter, fetchAllOrders])

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: `Order marked as ${statusLabels[status]}`, type: 'success' })
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
        setToast({ message: 'Failed to update order', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const displayedOrders = filter === 'active' ? orders : allOrders

  const enableNotifications = () => {
    setIsNotificationEnabled(true)
    // Create audio element for notification sound
    audioRef.current = new Audio('/notification.mp3')
    setToast({ message: 'Notifications enabled', type: 'success' })
  }

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">
              {filter === 'active'
                ? `${orders.length} active orders`
                : `${allOrders.length} total orders`}
            </p>
          </div>
          <div className="flex gap-2">
            {!isNotificationEnabled && filter === 'active' && (
              <Button variant="secondary" onClick={enableNotifications}>
                🔔 Enable Notifications
              </Button>
            )}
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'active'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {filter === 'active' ? 'No active orders' : 'No orders yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedOrders.map((order) => (
              <div
                key={order.id}
                className={`card cursor-pointer hover:shadow-lg transition-shadow ${
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
                      {formatDate(order.createdAt)}
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
                      Mark {statusLabels[nextStatus[order.status as OrderStatus]!]}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order - Table ${selectedOrder?.qrCode?.tableIdentifier}`}
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

            {/* Status Actions */}
            <div className="flex gap-2 pt-4">
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
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ClientLayout>
  )
}
