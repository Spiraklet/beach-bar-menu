'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Toast, ToastType } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import type { Item, CustomizationOption } from '@/types'

export default function StaffMenuPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/staff/items')
      const data = await response.json()

      if (data.success) {
        setItems(data.data.items)
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const toggleActive = async (item: Item) => {
    try {
      const response = await fetch('/api/staff/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      const data = await response.json()

      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.data : i))
        )
        setToast({
          message: `${item.name} marked as ${!item.active ? 'available' : 'unavailable'}`,
          type: 'success',
        })
      } else {
        setToast({ message: 'Failed to update item', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const toggleHidden = async (item: Item) => {
    try {
      const response = await fetch('/api/staff/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, hidden: !item.hidden }),
      })
      const data = await response.json()

      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.data : i))
        )
        setToast({
          message: `${item.name} ${!item.hidden ? 'hidden from' : 'shown on'} menu`,
          type: 'success',
        })
      } else {
        setToast({ message: 'Failed to update item', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const toggleOptionAvailable = async (item: Item, option: CustomizationOption) => {
    try {
      const response = await fetch('/api/staff/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          optionId: option.id,
          optionAvailable: !option.available,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.data : i))
        )
        setToast({
          message: `"${option.name}" marked as ${!option.available ? 'available' : 'unavailable'}`,
          type: 'success',
        })
      } else {
        setToast({ message: 'Failed to update option', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const toggleOptionHidden = async (item: Item, option: CustomizationOption) => {
    try {
      const response = await fetch('/api/staff/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          optionId: option.id,
          optionHidden: !option.hidden,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.data : i))
        )
        setToast({
          message: `"${option.name}" ${!option.hidden ? 'hidden from' : 'shown on'} menu`,
          type: 'success',
        })
      } else {
        setToast({ message: 'Failed to update option', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/staff/${token}/login`)
  }

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category)
    return acc
  }, {} as Record<string, Item[]>)

  const inactiveCount = items.filter((i) => !i.active).length
  const hiddenCount = items.filter((i) => i.hidden).length

  // Count items that have customizations with issues
  const getOptionIssueCount = (item: Item) => {
    if (!item.customizationSections) return 0
    let count = 0
    for (const section of item.customizationSections) {
      for (const option of section.options) {
        if (!option.available || option.hidden) count++
      }
    }
    return count
  }

  const hasCustomizations = (item: Item) =>
    item.customizationSections && item.customizationSections.length > 0 &&
    item.customizationSections.some(s => s.options.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Staff Portal</h1>
              <p className="text-sm text-gray-500">Menu Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 border-t">
          <nav className="flex gap-1">
            <a
              href={`/staff/${token}/orders`}
              className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Orders
            </a>
            <span
              className="px-4 py-3 text-sm font-medium text-primary-600 border-b-2 border-primary-600"
            >
              Menu
              {(inactiveCount > 0 || hiddenCount > 0) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                  {inactiveCount + hiddenCount}
                </span>
              )}
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Stats */}
        <div className="mb-6 flex gap-4 text-sm">
          <span className="text-gray-600">{items.length} items</span>
          {inactiveCount > 0 && (
            <span className="text-amber-600">{inactiveCount} unavailable</span>
          )}
          {hiddenCount > 0 && (
            <span className="text-gray-500">{hiddenCount} hidden</span>
          )}
        </div>

        {/* Menu Items */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading menu items...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
            <p className="text-gray-500">No menu items</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(
              ([category, categoryItems]) =>
                categoryItems.length > 0 && (
                  <div key={category}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                      {category}
                    </h2>
                    <div className="space-y-2">
                      {categoryItems.map((item) => {
                        const isExpanded = expandedItemId === item.id
                        const optionIssues = getOptionIssueCount(item)
                        const hasCust = hasCustomizations(item)

                        return (
                          <div
                            key={item.id}
                            className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
                              item.hidden ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Item Row */}
                            <div className="p-4 flex items-center justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => hasCust && setExpandedItemId(isExpanded ? null : item.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                                  <span className="text-sm text-primary-600 font-medium">
                                    {formatPrice(item.price)}
                                  </span>
                                  {hasCust && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                      {item.customizationSections!.reduce((n, s) => n + s.options.length, 0)} options
                                    </span>
                                  )}
                                  {optionIssues > 0 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                                      {optionIssues} off
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-4 ml-4">
                                {/* Active Toggle */}
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Available</span>
                                  <button
                                    onClick={() => toggleActive(item)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                      item.active ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        item.active ? 'left-7' : 'left-1'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Hidden Toggle */}
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Visible</span>
                                  <button
                                    onClick={() => toggleHidden(item)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                      !item.hidden ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        !item.hidden ? 'left-7' : 'left-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Customization Options */}
                            {isExpanded && hasCust && (
                              <div className="border-t bg-gray-50 px-4 py-3 space-y-4">
                                {item.customizationSections!.map((section) => (
                                  <div key={section.id}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-sm font-semibold text-gray-700">
                                        {section.name}
                                      </h4>
                                      <span className="text-xs text-gray-400">
                                        {section.required ? 'Required' : 'Optional'}
                                        {' • '}
                                        {section.multiSelect ? 'Multi-select' : 'Single-select'}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {section.options.map((option) => (
                                        <div
                                          key={option.id}
                                          className={`flex items-center justify-between py-2 px-3 rounded-md bg-white border ${
                                            !option.available || option.hidden
                                              ? 'border-amber-200 bg-amber-50/50'
                                              : 'border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm ${
                                              !option.available || option.hidden
                                                ? 'text-gray-400 line-through'
                                                : 'text-gray-800'
                                            }`}>
                                              {option.name}
                                            </span>
                                            {Number(option.price) !== 0 && (
                                              <span className="text-xs text-gray-500">
                                                {Number(option.price) > 0 ? '+' : ''}{formatPrice(option.price)}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-3">
                                            {/* Option Available Toggle */}
                                            <div className="flex flex-col items-center">
                                              <span className="text-[10px] text-gray-400 mb-0.5">Avail</span>
                                              <button
                                                onClick={() => toggleOptionAvailable(item, option)}
                                                className={`relative w-9 h-5 rounded-full transition-colors ${
                                                  option.available ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                                    option.available ? 'left-[18px]' : 'left-0.5'
                                                  }`}
                                                />
                                              </button>
                                            </div>

                                            {/* Option Visible Toggle */}
                                            <div className="flex flex-col items-center">
                                              <span className="text-[10px] text-gray-400 mb-0.5">Show</span>
                                              <button
                                                onClick={() => toggleOptionHidden(item, option)}
                                                className={`relative w-9 h-5 rounded-full transition-colors ${
                                                  !option.hidden ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                                    !option.hidden ? 'left-[18px]' : 'left-0.5'
                                                  }`}
                                                />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
