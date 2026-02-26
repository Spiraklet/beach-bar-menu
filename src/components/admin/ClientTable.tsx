'use client'

import { useState } from 'react'
import { Button, Modal, Input, Toast, ToastType } from '@/components/ui'
import { formatDate } from '@/lib/utils'

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

interface ClientTableProps {
  clients: Client[]
  onRefresh: () => void
}

export default function ClientTable({ clients, onRefresh }: ClientTableProps) {
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const [editForm, setEditForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
  })

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setEditForm({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingClient) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingClient.id, ...editForm }),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Client updated successfully', type: 'success' })
        setEditingClient(null)
        onRefresh()
      } else {
        setToast({ message: data.error || 'Failed to update client', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingClient) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/clients?id=${deletingClient.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Client deleted successfully', type: 'success' })
        setDeletingClient(null)
        onRefresh()
      } else {
        setToast({ message: data.error || 'Failed to delete client', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Client ID</th>
              <th className="table-header">Company Name</th>
              <th className="table-header">Contact Person</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Email</th>
              <th className="table-header">Items</th>
              <th className="table-header">QR Codes</th>
              <th className="table-header">Orders</th>
              <th className="table-header">Created</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono font-semibold">{client.clientId}</td>
                <td className="table-cell">{client.companyName}</td>
                <td className="table-cell">{client.contactPerson}</td>
                <td className="table-cell">{client.phone}</td>
                <td className="table-cell">{client.email}</td>
                <td className="table-cell text-center">{client._count.items}</td>
                <td className="table-cell text-center">{client._count.qrCodes}</td>
                <td className="table-cell text-center">{client._count.orders}</td>
                <td className="table-cell">{formatDate(client.createdAt)}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingClient(client)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No clients found. Create your first client to get started.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title="Edit Client"
      >
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={editForm.companyName}
            onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
          />
          <Input
            label="Contact Person"
            value={editForm.contactPerson}
            onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
          />
          <Input
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setEditingClient(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        title="Delete Client"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <strong>{deletingClient?.companyName}</strong>?
            This will also delete all their menu items, QR codes, and orders.
          </p>
          <p className="text-red-600 text-sm mb-6">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingClient(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>
              Delete Client
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
