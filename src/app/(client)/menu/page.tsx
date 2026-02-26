'use client'

import { useState, useEffect, useCallback } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import MenuItemForm from '@/components/client/MenuItemForm'
import { Button, Modal, Toast, ToastType } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import type { Item } from '@/types'

export default function MenuPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/client/items')
      const data = await response.json()

      if (data.success) {
        setItems(data.data.items)
        setCategories(data.data.categories)
      }
    } catch {
      setToast({ message: 'Failed to load menu items', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch(`/api/client/items?id=${deletingItem.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Item deleted successfully', type: 'success' })
        fetchItems()
      } else {
        setToast({ message: data.error || 'Failed to delete item', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setDeletingItem(null)
    }
  }

  const toggleActive = async (item: Item) => {
    try {
      const response = await fetch('/api/client/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      const data = await response.json()

      if (data.success) {
        fetchItems()
      } else {
        setToast({ message: 'Failed to update item', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems.filter((item) => item.category === category)
    return acc
  }, {} as Record<string, Item[]>)

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
            <p className="text-gray-600 mt-1">{items.length} items across {categories.length} categories</p>
          </div>
          <Button onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}>
              Add Item
            </Button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({items.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({items.filter((i) => i.category === category).length})
              </button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading menu items...</div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No menu items yet</p>
            <Button onClick={() => setIsFormOpen(true)}>Add Your First Item</Button>
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={`card relative ${!item.active ? 'opacity-60' : ''}`}
                        >
                          {/* Active badge */}
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={() => toggleActive(item)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {item.active ? 'Active' : 'Inactive'}
                            </button>
                          </div>

                          <div className="pr-20">
                            <p className="text-xs text-gray-400 font-mono">#{item.itemId}</p>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-primary-600 font-semibold mt-1">
                              {formatPrice(item.price)}
                            </p>
                          </div>

                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                          )}

                          {item.customizations && item.customizations.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {item.customizations.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                  >
                                    {c.name}
                                    {Number(c.price) > 0 && ` +${formatPrice(c.price)}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingItem(item)}
                              className="flex-1 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <MenuItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingItem(null)
        }}
        onSuccess={fetchItems}
        existingCategories={categories}
        editItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Delete Item"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
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
