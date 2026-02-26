'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Toast, ToastType } from '@/components/ui'
import ClientTable from '@/components/admin/ClientTable'
import CreateClientModal from '@/components/admin/CreateClientModal'

interface Client {
  id: string
  clientId: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  createdAt: string
  _count: {
    items: number
    qrCodes: number
    orders: number
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()

      if (data.success) {
        setClients(data.data)
      } else {
        setToast({ message: data.error || 'Failed to load clients', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to load clients', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch {
      setToast({ message: 'Logout failed', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Menu Items</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {clients.reduce((acc, c) => acc + c._count.items, 0)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {clients.reduce((acc, c) => acc + c._count.orders, 0)}
            </p>
          </div>
        </div>

        {/* Clients Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Client
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading clients...
            </div>
          ) : (
            <ClientTable clients={clients} onRefresh={fetchClients} />
          )}
        </div>
      </main>

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchClients}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
