import type { OrderStatus } from '@/types'

// ============================================================================
// ORDER STATUS CONSTANTS — Single source of truth
// ============================================================================

/** CSS badge classes for order status badges (defined in globals.css) */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'badge-new',
  PREPARING: 'badge-preparing',
  READY: 'badge-ready',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
}

/** Human-readable labels for order statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/** State machine: what's the next status after each status */
export const NEXT_ORDER_STATUS: Record<OrderStatus, OrderStatus | null> = {
  NEW: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
}

/** Customer-facing status config (for order view page) */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bg: string
  description: string
}> = {
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

/** All valid order statuses — for API validation */
export const VALID_ORDER_STATUSES: OrderStatus[] = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
