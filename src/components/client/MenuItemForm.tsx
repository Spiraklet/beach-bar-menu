'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal, Select, Toast, ToastType } from '@/components/ui'
import type { Item, ItemCustomization, CustomizationAction } from '@/types'

interface MenuItemFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingCategories: string[]
  editItem?: Item | null
}

interface CustomizationInput {
  name: string
  price: string
  action: CustomizationAction
}

export default function MenuItemForm({
  isOpen,
  onClose,
  onSuccess,
  existingCategories,
  editItem,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    newCategory: '',
  })
  const [customizations, setCustomizations] = useState<CustomizationInput[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [useNewCategory, setUseNewCategory] = useState(false)

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        price: editItem.price.toString(),
        description: editItem.description || '',
        category: editItem.category,
        newCategory: '',
      })
      setCustomizations(
        (editItem.customizations || []).map((c: ItemCustomization) => ({
          name: c.name,
          price: c.price.toString(),
          action: c.action,
        }))
      )
      setUseNewCategory(false)
    } else {
      setFormData({
        name: '',
        price: '',
        description: '',
        category: existingCategories[0] || '',
        newCategory: '',
      })
      setCustomizations([])
      setUseNewCategory(existingCategories.length === 0)
    }
  }, [editItem, existingCategories, isOpen])

  const handleAddCustomization = () => {
    setCustomizations([
      ...customizations,
      { name: '', price: '0', action: 'ADD' },
    ])
  }

  const handleRemoveCustomization = (index: number) => {
    setCustomizations(customizations.filter((_, i) => i !== index))
  }

  const handleCustomizationChange = (
    index: number,
    field: keyof CustomizationInput,
    value: string
  ) => {
    const updated = [...customizations]
    updated[index] = { ...updated[index], [field]: value }
    setCustomizations(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const category = useNewCategory ? formData.newCategory : formData.category

    if (!category) {
      setToast({ message: 'Please select or enter a category', type: 'error' })
      setIsLoading(false)
      return
    }

    const payload = {
      id: editItem?.id,
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description || null,
      category,
      customizations: customizations
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name,
          price: parseFloat(c.price) || 0,
          action: c.action,
        })),
    }

    try {
      const response = await fetch('/api/client/items', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setToast({
          message: editItem ? 'Item updated successfully' : 'Item created successfully',
          type: 'success',
        })
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      } else {
        setToast({ message: data.error || 'Failed to save item', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Item Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Mojito"
            />

            <Input
              label="Price (€)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              placeholder="8.50"
            />
          </div>

          <Input
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Fresh mint, lime, rum, and soda water"
          />

          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            {existingCategories.length > 0 && (
              <div className="flex gap-2 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!useNewCategory}
                    onChange={() => setUseNewCategory(false)}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Existing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={useNewCategory}
                    onChange={() => setUseNewCategory(true)}
                    className="text-primary-600"
                  />
                  <span className="text-sm">New category</span>
                </label>
              </div>
            )}

            {useNewCategory || existingCategories.length === 0 ? (
              <Input
                value={formData.newCategory}
                onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })}
                required
                placeholder="Enter new category name"
              />
            ) : (
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={existingCategories.map((c) => ({ value: c, label: c }))}
              />
            )}
          </div>

          {/* Customizations */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customizations (optional)
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddCustomization}>
                + Add Option
              </Button>
            </div>

            {customizations.length > 0 && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {customizations.map((cust, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      value={cust.name}
                      onChange={(e) => handleCustomizationChange(index, 'name', e.target.value)}
                      placeholder="Option name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={cust.price}
                      onChange={(e) => handleCustomizationChange(index, 'price', e.target.value)}
                      placeholder="Price"
                      className="w-24"
                    />
                    <Select
                      value={cust.action}
                      onChange={(e) =>
                        handleCustomizationChange(index, 'action', e.target.value as CustomizationAction)
                      }
                      options={[
                        { value: 'ADD', label: 'Add (multi)' },
                        { value: 'CHOOSE', label: 'Choose one' },
                        { value: 'CHANGE', label: 'Change (req.)' },
                        { value: 'REMOVE', label: 'Remove (multi)' },
                      ]}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomization(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}
