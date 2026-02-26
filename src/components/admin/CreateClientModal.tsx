'use client'

import { useState } from 'react'
import { Button, Input, Modal, Toast, ToastType } from '@/components/ui'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: `Client created with ID: ${data.data.clientId}`, type: 'success' })
        setFormData({
          companyName: '',
          contactPerson: '',
          phone: '',
          email: '',
          password: '',
        })
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setToast({ message: data.error || 'Failed to create client', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const generatePassword = () => {
    // Generate a compliant password: 10+ chars, uppercase, lowercase, number, special char
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const special = '!@#$%^&*'
    const all = uppercase + lowercase + numbers + special

    // Ensure at least one of each required type
    let password =
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)]

    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    setFormData({ ...formData, password })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Client" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
            placeholder="Beach Paradise Bar"
          />

          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
            placeholder="John Doe"
          />

          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="+30 123 456 7890"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="contact@beachbar.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                required
                placeholder="Min 10 chars, upper, lower, number, special"
                minLength={10}
              />
              <Button type="button" variant="secondary" onClick={generatePassword}>
                Generate
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Min 10 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Client
            </Button>
          </div>
        </form>
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
