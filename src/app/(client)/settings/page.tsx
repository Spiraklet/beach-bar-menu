'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ClientLayout from '@/components/client/ClientLayout'
import { Button, Input, Toast, ToastType } from '@/components/ui'

interface ClientSettings {
  id: string
  clientId: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  stripeAccountId: string | null
  stripeStatus: {
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
  } | null
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<ClientSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnectingStripe, setIsConnectingStripe] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    password: '',
  })

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/client/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setFormData({
          companyName: data.data.companyName,
          contactPerson: data.data.contactPerson,
          phone: data.data.phone,
          password: '',
        })
      }
    } catch {
      setToast({ message: 'Failed to load settings', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()

    // Check for Stripe callback
    const stripeStatus = searchParams.get('stripe')
    if (stripeStatus === 'success') {
      setToast({ message: 'Stripe account connected successfully!', type: 'success' })
    } else if (stripeStatus === 'refresh') {
      setToast({ message: 'Please complete your Stripe account setup', type: 'info' })
    }
  }, [fetchSettings, searchParams])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/client/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          password: formData.password || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Settings saved successfully', type: 'success' })
        setFormData((prev) => ({ ...prev, password: '' }))
        fetchSettings()
      } else {
        setToast({ message: data.error || 'Failed to save settings', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true)

    try {
      const response = await fetch('/api/client/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })

      const data = await response.json()

      if (data.success && data.data.url) {
        window.location.href = data.data.url
      } else {
        setToast({ message: data.error || 'Failed to connect Stripe', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsConnectingStripe(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading settings...</div>
    )
  }

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Business Information */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Client ID</label>
                <p className="text-lg font-mono font-semibold text-gray-900">
                  {settings?.clientId}
                </p>
              </div>
              <div>
                <label className="label">Email</label>
                <p className="text-gray-600">{settings?.email}</p>
              </div>
            </div>

            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />

            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Password Change */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

          <div className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Leave blank to keep current"
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Min 10 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
          </div>
        </div>

        {/* Stripe Connect */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h2>

          {settings?.stripeAccountId && settings?.stripeStatus ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    settings.stripeStatus.chargesEnabled ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {settings.stripeStatus.chargesEnabled
                    ? 'Payments enabled'
                    : 'Account setup incomplete'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-gray-500">Charges</p>
                  <p className={settings.stripeStatus.chargesEnabled ? 'text-green-600' : 'text-yellow-600'}>
                    {settings.stripeStatus.chargesEnabled ? 'Enabled' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Payouts</p>
                  <p className={settings.stripeStatus.payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}>
                    {settings.stripeStatus.payoutsEnabled ? 'Enabled' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Details</p>
                  <p className={settings.stripeStatus.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}>
                    {settings.stripeStatus.detailsSubmitted ? 'Complete' : 'Pending'}
                  </p>
                </div>
              </div>

              {!settings.stripeStatus.detailsSubmitted && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={handleConnectStripe}
                  isLoading={isConnectingStripe}
                >
                  Complete Stripe Setup
                </Button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Connect your Stripe account to accept payments from customers. Stripe will
                handle all payment processing securely.
              </p>
              <Button onClick={handleConnectStripe} isLoading={isConnectingStripe}>
                Connect Stripe Account
              </Button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}

export default function SettingsPage() {
  return (
    <ClientLayout>
      <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading...</div>}>
        <SettingsContent />
      </Suspense>
    </ClientLayout>
  )
}
