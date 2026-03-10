'use client'

import { useState, useEffect, useCallback } from 'react'
import ClientLayout from '@/components/client/ClientLayout'
import MenuItemForm from '@/components/client/MenuItemForm'
import MenuPreview from '@/components/client/MenuPreview'
import ReorderButtons from '@/components/client/ReorderButtons'
import { Button, Modal, Toast } from '@/components/ui'
import { useToast } from '@/hooks'
import { api } from '@/lib/api-client'
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { toast, showToast, dismissToast } = useToast()

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.get('/api/client/items')

      if (data.success) {
        setItems(data.data.items)
        setCategories(data.data.categories)
      }
    } catch {
      showToast('Failed to load menu items', 'error')
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
      const data = await api.delete(`/api/client/items?id=${deletingItem.id}`)

      if (data.success) {
        showToast('Item deleted successfully', 'success')
        fetchItems()
      } else {
        showToast(data.error || 'Failed to delete item', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
    } finally {
      setDeletingItem(null)
    }
  }

  const toggleActive = async (item: Item) => {
    try {
      const data = await api.patch('/api/client/items', { id: item.id, active: !item.active })

      if (data.success) {
        fetchItems()
      } else {
        showToast('Failed to update item', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
    }
  }

  // Reorder API call helper
  const reorder = async (type: string, payload: Record<string, unknown>) => {
    try {
      const data = await api.patch('/api/client/items/reorder', { type, ...payload })
      if (!data.success) {
        showToast('Failed to reorder', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
    }
  }

  // Move a category up/down
  const moveCategory = async (catIdx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? catIdx - 1 : catIdx + 1
    if (newIdx < 0 || newIdx >= categories.length) return

    const newOrder = [...categories]
    ;[newOrder[catIdx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[catIdx]]
    setCategories(newOrder)
    await reorder('categories', { categoryOrder: newOrder })
  }

  // Move an item up/down within its category
  const moveItem = async (item: Item, direction: 'up' | 'down') => {
    const categoryItems = items
      .filter((i) => i.category === item.category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = categoryItems.findIndex((i) => i.id === item.id)
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= categoryItems.length) return

    // Swap sort orders
    const updatedItems = categoryItems.map((ci, i) => ({
      ...ci,
      sortOrder: i === idx ? newIdx : i === newIdx ? idx : i,
    }))

    // Optimistic update in local state
    setItems((prev) =>
      prev.map((i) => {
        const updated = updatedItems.find((u) => u.id === i.id)
        return updated ? { ...i, sortOrder: updated.sortOrder } : i
      })
    )

    await reorder('items', {
      items: updatedItems.map((i) => ({ id: i.id, sortOrder: i.sortOrder })),
    })
  }

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items

  const groupedItems: Record<string, Item[]> = {}
  for (const cat of categories) {
    const catItems = filteredItems
      .filter((item) => item.category === cat)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    if (catItems.length > 0 || !selectedCategory) {
      groupedItems[cat] = catItems
    }
  }

  return (
    <ClientLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
            <p className="text-gray-600 mt-1">{items.length} items across {categories.length} categories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsPreviewOpen(true)}>
              Preview
            </Button>
            <Button onClick={() => {
                setEditingItem(null)
                setIsFormOpen(true)
              }}>
                Add Item
            </Button>
          </div>
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
              ([category, categoryItems], catIdx) =>
                categoryItems.length > 0 && (
                  <div key={category}>
                    {/* Category header with reorder */}
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                      {!selectedCategory && (
                        <ReorderButtons
                          onMoveUp={() => moveCategory(catIdx, 'up')}
                          onMoveDown={() => moveCategory(catIdx, 'down')}
                          isFirst={catIdx === 0}
                          isLast={catIdx === Object.keys(groupedItems).length - 1}
                          size="sm"
                          direction="horizontal"
                        />
                      )}
                      <h2 className="text-lg font-semibold text-gray-900">
                        {category}
                      </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryItems.map((item, itemIdx) => (
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

                          <div className="flex gap-2">
                            {/* Reorder buttons for items */}
                            <ReorderButtons
                              onMoveUp={() => moveItem(item, 'up')}
                              onMoveDown={() => moveItem(item, 'down')}
                              isFirst={itemIdx === 0}
                              isLast={itemIdx === categoryItems.length - 1}
                            />
                            <div className="pr-16 flex-1 min-w-0">
                              <p className="text-xs text-gray-400 font-mono">#{item.itemId}</p>
                              <h3 className="font-semibold text-gray-900">{item.name}</h3>
                              <p className="text-primary-600 font-semibold mt-1">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                          )}

                          {/* Customization sections display */}
                          {item.customizationSections && item.customizationSections.length > 0 && (
                            <div className="mt-3 pt-3 border-t space-y-2">
                              {item.customizationSections.map((section) => (
                                <div key={section.id}>
                                  <p className="text-xs text-gray-500 font-medium">
                                    {section.name}
                                    {section.required && <span className="text-red-500 ml-1">*</span>}
                                    <span className="text-gray-400 ml-1">
                                      ({section.multiSelect ? 'multi' : 'single'})
                                    </span>
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {section.options.map((opt) => (
                                      <span
                                        key={opt.id}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                      >
                                        {opt.name}
                                        {Number(opt.price) > 0 && ` +${formatPrice(opt.price)}`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
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

      {/* Menu Preview Modal */}
      <MenuPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={items}
        categories={categories}
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
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      )}
    </ClientLayout>
  )
}
