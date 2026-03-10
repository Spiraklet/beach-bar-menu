import { useState, useCallback } from 'react'
import type { ToastType } from '@/components/ui'

interface ToastState {
  message: string
  type: ToastType
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  return { toast, showToast, dismissToast } as const
}
