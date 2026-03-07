'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

interface OrderItem {
  id: string
  itemNameSnapshot: string
  itemPriceSnapshot: number
  quantity: number
  customizations: Array<{ name: string; price: number }> | null
  subtotal: number
  note: string | null
}

interface OrderData {
  id: string
  displayCode: string
  status: OrderStatus
  total: number
  customerNote: string | null
  customerEmail: string | null
  createdAt: string
  client: { companyName: string }
  qrCode: { tableIdentifier: string }
  items: OrderItem[]
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; description: string }> = {
  NEW: {
    label: 'Order Received',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    description: 'Your order has been received and is waiting to be prepared.',
  },
  PREPARING: {
    label: 'Being Prepared',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    description: 'Your order is being prepared right now!',
  },
  READY: {
    label: 'Ready!',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    description: 'Your order is ready!',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-gray-700',
    bg: 'bg-gray-50 border-gray-200',
    description: 'Your order has been completed. Enjoy!',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    description: 'This order has been cancelled. Please contact the staff.',
  },
}

export default function OrderViewPage() {
  const params = useParams()
  const viewToken = params.viewToken as string

  const [order, setOrder] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/order/${viewToken}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        if (data.data.customerEmail) {
          setEmailSent(true)
        }
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [viewToken])

  useEffect(() => {
    fetchOrder()
    // Auto-refresh status every 15 seconds while order is active
    const interval = setInterval(() => {
      if (order && !['COMPLETED', 'CANCELLED'].includes(order.status)) {
        fetchOrder()
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchOrder, order])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setIsSendingEmail(true)
    try {
      const res = await fetch(`/api/order/${viewToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailSent(true)
      } else {
        setEmailError(data.error || 'Failed to send email. Please try again.')
      }
    } catch {
      setEmailError('Failed to send email. Please try again.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your order...</p>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-500">This link is invalid or the order does not exist.</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Confirmed</h1>
          <p className="text-gray-500 mt-1">{order.client.companyName} · Table {order.qrCode.tableIdentifier}</p>
        </div>

        {/* Order Number */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Order Number</p>
          <p className="text-3xl font-bold text-primary-600">#{order.displayCode}</p>
        </div>

        {/* Status */}
        <div className={`rounded-xl border p-4 mb-4 ${statusConfig.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${order.status === 'NEW' ? 'bg-blue-500' : order.status === 'PREPARING' ? 'bg-amber-500 animate-pulse' : order.status === 'READY' ? 'bg-green-500' : order.status === 'COMPLETED' ? 'bg-gray-400' : 'bg-red-500'}`} />
            <div>
              <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
              <p className={`text-sm ${statusConfig.color} opacity-80`}>{statusConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your Order</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.quantity > 1 && (
                        <span className="text-primary-600 font-bold mr-1">{item.quantity}×</span>
                      )}
                      {item.itemNameSnapshot}
                    </p>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.customizations.map((c) => c.name).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-amber-600 mt-0.5 italic">📝 {item.note}</p>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium whitespace-nowrap">
                    €{Number(item.subtotal).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">€{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Note */}
        {order.customerNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">Your Note</p>
            <p className="text-sm text-amber-700">{order.customerNote}</p>
          </div>
        )}

        {/* Email Confirmation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Email Confirmation</h2>
          <p className="text-sm text-gray-500 mb-4">Optionally receive this order by email.</p>

          {emailSent ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700">Confirmation sent! Check your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input flex-1 text-sm"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={isSendingEmail || !email}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isSendingEmail ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
          {emailError && (
            <p className="text-sm text-red-600 mt-2">{emailError}</p>
          )}
        </div>

      </div>
    </div>
  )
}
