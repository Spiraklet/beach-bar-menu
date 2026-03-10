'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Toast } from '@/components/ui'
import { useToast } from '@/hooks'
import { api } from '@/lib/api-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast, showToast, dismissToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await api.post('/api/auth/admin/login', { email, password })

      if (data.success) {
        router.push('/admin/dashboard')
      } else {
        showToast(data.error || 'Login failed', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage beach bar clients
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Password requirements:</p>
          <p>10+ characters, uppercase, lowercase, number, special character</p>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}
    </div>
  )
}
