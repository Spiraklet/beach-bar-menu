'use client'

import { Modal } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import type { Item } from '@/types'

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
  // Group items by category (only visible, active items for preview)
  const visibleItems = items.filter((item) => !item.hidden)
  const groupedItems: Record<string, Item[]> = {}
  for (const cat of categories) {
    const catItems = visibleItems.filter((item) => item.category === cat)
    if (catItems.length > 0) {
      groupedItems[cat] = catItems
    }
  }

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

            {/* Menu content */}
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
                          <div
                            key={item.id}
                            className={`bg-white rounded-xl p-3 shadow-sm ${
                              !item.active ? 'opacity-50' : ''
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
                                {/* Show section badges */}
                                {item.customizationSections && item.customizationSections.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.customizationSections.map((section) => (
                                      <span
                                        key={section.id}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600"
                                      >
                                        {section.name}
                                        {section.required && <span className="text-red-500 ml-0.5">*</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-primary-600 flex-shrink-0">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
