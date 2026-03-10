'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal, Select, Toast } from '@/components/ui'
import { useToast } from '@/hooks'
import { api } from '@/lib/api-client'
import ReorderButtons from '@/components/client/ReorderButtons'
import type { Item, SectionInput } from '@/types'

interface MenuItemFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingCategories: string[]
  editItem?: Item | null
}

interface SectionFormData {
  name: string
  required: boolean
  multiSelect: boolean
  options: { name: string; price: string }[]
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
  const [sections, setSections] = useState<SectionFormData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast, showToast, dismissToast } = useToast()
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
      // Load existing sections
      setSections(
        (editItem.customizationSections || []).map((s) => ({
          name: s.name,
          required: s.required,
          multiSelect: s.multiSelect,
          options: s.options.map((o) => ({
            name: o.name,
            price: o.price.toString(),
          })),
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
      setSections([])
      setUseNewCategory(existingCategories.length === 0)
    }
  }, [editItem, existingCategories, isOpen])

  // Section management
  const addSection = () => {
    setSections([...sections, { name: '', required: false, multiSelect: false, options: [{ name: '', price: '0' }] }])
  }

  const removeSection = (sIdx: number) => {
    setSections(sections.filter((_, i) => i !== sIdx))
  }

  const updateSection = (sIdx: number, field: keyof SectionFormData, value: unknown) => {
    const updated = [...sections]
    updated[sIdx] = { ...updated[sIdx], [field]: value }
    setSections(updated)
  }

  const moveSection = (sIdx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? sIdx - 1 : sIdx + 1
    if (newIdx < 0 || newIdx >= sections.length) return
    const updated = [...sections]
    ;[updated[sIdx], updated[newIdx]] = [updated[newIdx], updated[sIdx]]
    setSections(updated)
  }

  // Option management within a section
  const addOption = (sIdx: number) => {
    const updated = [...sections]
    updated[sIdx] = {
      ...updated[sIdx],
      options: [...updated[sIdx].options, { name: '', price: '0' }],
    }
    setSections(updated)
  }

  const removeOption = (sIdx: number, oIdx: number) => {
    const updated = [...sections]
    updated[sIdx] = {
      ...updated[sIdx],
      options: updated[sIdx].options.filter((_, i) => i !== oIdx),
    }
    setSections(updated)
  }

  const updateOption = (sIdx: number, oIdx: number, field: 'name' | 'price', value: string) => {
    const updated = [...sections]
    updated[sIdx] = {
      ...updated[sIdx],
      options: updated[sIdx].options.map((opt, i) =>
        i === oIdx ? { ...opt, [field]: value } : opt
      ),
    }
    setSections(updated)
  }

  const moveOption = (sIdx: number, oIdx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? oIdx - 1 : oIdx + 1
    const opts = sections[sIdx].options
    if (newIdx < 0 || newIdx >= opts.length) return
    const updated = [...sections]
    const newOpts = [...opts]
    ;[newOpts[oIdx], newOpts[newIdx]] = [newOpts[newIdx], newOpts[oIdx]]
    updated[sIdx] = { ...updated[sIdx], options: newOpts }
    setSections(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const category = useNewCategory ? formData.newCategory : formData.category

    if (!category) {
      showToast('Please select or enter a category', 'error')
      setIsLoading(false)
      return
    }

    // Build sections payload — filter out empty sections/options
    const customizationSections: SectionInput[] = sections
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        required: s.required,
        multiSelect: s.multiSelect,
        options: s.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name.trim(),
            price: parseFloat(o.price) || 0,
          })),
      }))
      .filter((s) => s.options.length > 0)

    const payload = {
      id: editItem?.id,
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description || null,
      category,
      customizationSections: customizationSections.length > 0 ? customizationSections : undefined,
    }

    try {
      const data = editItem
        ? await api.patch('/api/client/items', payload)
        : await api.post('/api/client/items', payload)

      if (data.success) {
        showToast(editItem ? 'Item updated successfully' : 'Item created successfully', 'success')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1000)
      } else {
        showToast(data.error || 'Failed to save item', 'error')
      }
    } catch {
      showToast('An error occurred', 'error')
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

          {/* Customization Sections */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customization Sections
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={addSection}>
                + Add Section
              </Button>
            </div>

            {sections.length > 0 && (
              <div className="space-y-4">
                {sections.map((section, sIdx) => (
                  <div key={sIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {/* Section header */}
                    <div className="flex items-start gap-2 mb-3">
                      <ReorderButtons
                        onMoveUp={() => moveSection(sIdx, 'up')}
                        onMoveDown={() => moveSection(sIdx, 'down')}
                        isFirst={sIdx === 0}
                        isLast={sIdx === sections.length - 1}
                      />
                      <div className="flex-1">
                        <Input
                          value={section.name}
                          onChange={(e) => updateSection(sIdx, 'name', e.target.value)}
                          placeholder="Section name (e.g., Size, Toppings)"
                          className="font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSection(sIdx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove section"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Section toggles */}
                    <div className="flex gap-4 mb-3 ml-8">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={section.required}
                          onChange={(e) => updateSection(sIdx, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={section.multiSelect}
                          onChange={(e) => updateSection(sIdx, 'multiSelect', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Multi-select
                      </label>
                    </div>

                    {/* Options within section */}
                    <div className="ml-8 space-y-2">
                      {section.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <ReorderButtons
                            onMoveUp={() => moveOption(sIdx, oIdx, 'up')}
                            onMoveDown={() => moveOption(sIdx, oIdx, 'down')}
                            isFirst={oIdx === 0}
                            isLast={oIdx === section.options.length - 1}
                            size="sm"
                            direction="horizontal"
                          />
                          <Input
                            value={opt.name}
                            onChange={(e) => updateOption(sIdx, oIdx, 'name', e.target.value)}
                            placeholder="Option name"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={opt.price}
                            onChange={(e) => updateOption(sIdx, oIdx, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-24"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(sIdx, oIdx)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-sm"
                            title="Remove option"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(sIdx)}
                        className="text-xs"
                      >
                        + Add Option
                      </Button>
                    </div>
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
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      )}
    </>
  )
}
