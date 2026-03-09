'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import type { Item, SelectedCustomization, CustomizationSection } from '@/types'

interface MenuPreviewProps {
  isOpen: boolean
  onClose: () => void
  items: Item[]
  categories: string[]
  clientName?: string
}

export default function MenuPreview({
  isOpen,
  onClose,
  items,
  categories,
  clientName = 'Restaurant',
}: MenuPreviewProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([])
  const [itemQuantity, setItemQuantity] = useState(1)

  // Group items by category (only visible items for preview)
  const visibleItems = items.filter((item) => !item.hidden)
  const groupedItems: Record<string, Item[]> = {}
  for (const cat of categories) {
    const catItems = visibleItems.filter((item) => item.category === cat)
    if (catItems.length > 0) {
      groupedItems[cat] = catItems
    }
  }

  const openItem = (item: Item) => {
    if (!item.active) return
    setSelectedItem(item)
    setSelectedCustomizations([])
    setItemQuantity(1)
  }

  const closeItem = () => {
    setSelectedItem(null)
  }

  const toggleCustomization = (cust: SelectedCustomization, section: CustomizationSection) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.find((c) => c.optionId === cust.optionId)

      if (!section.multiSelect) {
        const withoutSection = prev.filter((c) => c.sectionId !== section.id)
        if (exists) return withoutSection
        return [...withoutSection, cust]
      }

      if (exists) return prev.filter((c) => c.optionId !== cust.optionId)
      return [...prev, cust]
    })
  }

  const canAddToCart = () => {
    if (!selectedItem) return false
    const sections = selectedItem.customizationSections || []
    for (const section of sections) {
      if (section.required && !selectedCustomizations.some((c) => c.sectionId === section.id)) {
        return false
      }
    }
    return true
  }

  const customizationPrice = selectedCustomizations.reduce((sum, c) => sum + c.price, 0)
  const totalPrice = selectedItem
    ? (Number(selectedItem.price) + customizationPrice) * itemQuantity
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Menu Preview" size="lg">
      <div className="flex justify-center">
        {/* Phone Frame */}
        <div className="relative w-[375px] h-[700px] bg-black rounded-[3rem] p-3 shadow-2xl">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-10" />

          {/* Screen */}
          <div className="w-full h-full bg-[#faf8f5] rounded-[2.25rem] overflow-hidden flex flex-col">
            {/* Status bar spacer */}
            <div className="h-12 bg-white flex-shrink-0" />

            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm flex-shrink-0">
              <h1 className="text-lg font-bold text-gray-900">{clientName}</h1>
              <p className="text-xs text-gray-500">Table: 1</p>

              {/* Category pills */}
              {categories.length > 1 && (
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white whitespace-nowrap flex-shrink-0">
                    All
                  </span>
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border whitespace-nowrap flex-shrink-0"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content area — menu listing or item detail */}
            {selectedItem ? (
              /* Item Detail View */
              <div className="flex-1 overflow-y-auto">
                {/* Back button */}
                <div className="sticky top-0 bg-white border-b px-4 py-2 flex items-center gap-2 z-10">
                  <button
                    onClick={closeItem}
                    className="text-primary-600 text-sm font-medium flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <span className="text-sm font-semibold text-gray-900 truncate">{selectedItem.name}</span>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {selectedItem.description && (
                    <p className="text-xs text-gray-600">{selectedItem.description}</p>
                  )}

                  <p className="text-base font-semibold text-primary-600">
                    {formatPrice(selectedItem.price)}
                  </p>

                  {/* Customization Sections */}
                  {selectedItem.customizationSections && selectedItem.customizationSections.length > 0 && (
                    <div className="space-y-3">
                      {selectedItem.customizationSections.map((section) => {
                        const sectionMissing = section.required && !selectedCustomizations.some((c) => c.sectionId === section.id)

                        return (
                          <div key={section.id}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <p className="text-xs font-semibold text-gray-900">{section.name}</p>
                              {section.required ? (
                                <span className="text-[10px] px-1 py-0.5 bg-red-100 text-red-700 rounded">Required</span>
                              ) : (
                                <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">Optional</span>
                              )}
                              {!section.multiSelect && (
                                <span className="text-[10px] text-gray-400">(pick one)</span>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {section.options.map((opt) => {
                                const isSelected = selectedCustomizations.some((c) => c.optionId === opt.id)

                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() =>
                                      toggleCustomization(
                                        {
                                          optionId: opt.id,
                                          sectionId: section.id,
                                          sectionName: section.name,
                                          name: opt.name,
                                          price: Number(opt.price),
                                        },
                                        section
                                      )
                                    }
                                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors text-left ${
                                      isSelected
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {section.multiSelect ? (
                                        <span
                                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                                          }`}
                                        >
                                          {isSelected && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </span>
                                      ) : (
                                        <span
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? 'border-primary-600' : 'border-gray-300'
                                          }`}
                                        >
                                          {isSelected && (
                                            <span className="w-2 h-2 rounded-full bg-primary-600" />
                                          )}
                                        </span>
                                      )}
                                      <span className="text-xs">{opt.name}</span>
                                    </div>
                                    {Number(opt.price) !== 0 && (
                                      <span className="text-xs text-gray-500">
                                        {Number(opt.price) > 0 ? '+' : ''}{formatPrice(opt.price)}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {sectionMissing && (
                              <p className="text-[10px] text-red-500 mt-1">Please make a selection</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1.5">Quantity</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{itemQuantity}</span>
                      <button
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={closeItem}
                    disabled={!canAddToCart()}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
                      canAddToCart()
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Add to Cart • {formatPrice(totalPrice)}
                  </button>
                </div>
              </div>
            ) : (
              /* Menu Listing */
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {Object.keys(groupedItems).length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No items to show</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, catItems]) => (
                      <div key={category}>
                        <h2 className="text-sm font-semibold text-gray-900 mb-2">{category}</h2>
                        <div className="space-y-2">
                          {catItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => openItem(item)}
                              disabled={!item.active}
                              className={`w-full bg-white rounded-xl p-3 shadow-sm text-left transition-shadow ${
                                item.active ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-2 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                      {item.name}
                                    </h3>
                                    {!item.active && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded flex-shrink-0">
                                        N/A
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-primary-600 flex-shrink-0">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom home indicator */}
            <div className="h-8 bg-white flex items-center justify-center flex-shrink-0">
              <div className="w-32 h-1 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
