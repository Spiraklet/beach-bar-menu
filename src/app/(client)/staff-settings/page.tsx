'use client'

import { useState, useEffect } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import { Button, Input, Modal, Toast, ToastType } from '@/components/ui'

interface StaffSettingsData {
  id: string
  staffToken: string
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export default function StaffSettingsPage() {
  const [settings, setSettings] = useState<StaffSettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/client/staff-settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch staff settings:', error)
      setToast({ message: 'Failed to load staff settings', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const getStaffPortalUrl = () => {
    if (!settings?.staffToken) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/staff/${settings.staffToken}/orders`
  }

  const copyToClipboard = async () => {
    const url = getStaffPortalUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' })
    }
  }

  const handleSetup = async () => {
    // Staff password: min 6 chars, at least 1 letter and 1 number
    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' })
      return
    }
    if (!/[a-zA-Z]/.test(password)) {
      setToast({ message: 'Password must contain at least one letter', type: 'error' })
      return
    }
    if (!/[0-9]/.test(password)) {
      setToast({ message: 'Password must contain at least one number', type: 'error' })
      return
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/staff-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setIsSetupModalOpen(false)
        setPassword('')
        setConfirmPassword('')
        setToast({ message: 'Staff portal enabled successfully', type: 'success' })
      } else {
        setToast({ message: data.error || 'Failed to enable staff portal', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    // Staff password: min 6 chars, at least 1 letter and 1 number
    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' })
      return
    }
    if (!/[a-zA-Z]/.test(password)) {
      setToast({ message: 'Password must contain at least one letter', type: 'error' })
      return
    }
    if (!/[0-9]/.test(password)) {
      setToast({ message: 'Password must contain at least one number', type: 'error' })
      return
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/staff-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setIsChangePasswordModalOpen(false)
        setPassword('')
        setConfirmPassword('')
        setToast({ message: 'Password updated successfully', type: 'success' })
      } else {
        setToast({ message: data.error || 'Failed to update password', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegenerateToken = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/staff-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateToken: true }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        setIsRegenerateModalOpen(false)
        setToast({ message: 'New URL generated. Share the new link with your staff.', type: 'success' })
      } else {
        setToast({ message: data.error || 'Failed to regenerate token', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/client/staff-settings', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSettings(null)
        setIsDeleteModalOpen(false)
        setToast({ message: 'Staff portal disabled', type: 'success' })
      } else {
        setToast({ message: data.error || 'Failed to disable staff portal', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="p-6 lg:p-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Portal</h1>
          <p className="text-gray-600 mb-8">
            Give your staff access to view and manage orders without sharing your main account.
          </p>

          {!settings ? (
            // Setup state - no staff portal configured
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Staff Portal Not Configured</h2>
                <p className="text-gray-600 mb-6">
                  Enable the staff portal to give your team a dedicated link to manage orders.
                </p>
                <Button onClick={() => setIsSetupModalOpen(true)}>
                  Enable Staff Portal
                </Button>
              </div>
            </div>
          ) : (
            // Configured state
            <div className="space-y-6">
              {/* Staff Portal URL */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Portal URL</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Share this link with your staff. They will need the password to access it.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getStaffPortalUrl()}
                    className="input flex-1 bg-gray-50 text-gray-700 font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} variant="secondary">
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Password Management */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Staff members will need this password to access the portal (min 6 chars with letter and number).
                </p>
                <Button onClick={() => setIsChangePasswordModalOpen(true)} variant="secondary">
                  Change Password
                </Button>
              </div>

              {/* Advanced Options */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Regenerate URL</p>
                      <p className="text-sm text-gray-600">Create a new staff portal link. The old link will stop working.</p>
                    </div>
                    <Button onClick={() => setIsRegenerateModalOpen(true)} variant="secondary" size="sm">
                      Regenerate
                    </Button>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Disable Staff Portal</p>
                      <p className="text-sm text-gray-600">Remove staff access completely.</p>
                    </div>
                    <Button onClick={() => setIsDeleteModalOpen(true)} variant="danger" size="sm">
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false)
          setPassword('')
          setConfirmPassword('')
        }}
        title="Enable Staff Portal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set a password for your staff (min 6 characters with at least 1 letter and 1 number).
          </p>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setIsSetupModalOpen(false)
                setPassword('')
                setConfirmPassword('')
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetup}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Enable
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={() => {
          setIsChangePasswordModalOpen(false)
          setPassword('')
          setConfirmPassword('')
        }}
        title="Change Staff Password"
      >
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setIsChangePasswordModalOpen(false)
                setPassword('')
                setConfirmPassword('')
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Token Modal */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title="Regenerate Staff URL?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will create a new staff portal URL. The current URL will stop working immediately.
            Make sure to share the new link with your staff.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsRegenerateModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateToken}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Regenerate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Disable Staff Portal?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will remove staff access to the order management portal. You can enable it again later.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </ClientLayout>
  )
}
