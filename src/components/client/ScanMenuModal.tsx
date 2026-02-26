'use client'

import { useState, useRef } from 'react'
import { Modal, Button, Toast, ToastType } from '@/components/ui'
import { type ExtractedItem } from '@/lib/ocr'

interface ScanMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingCategories: string[]
}

type Step = 'upload' | 'processing' | 'review' | 'importing'

export default function ScanMenuModal({
  isOpen,
  onClose,
  onSuccess,
  existingCategories,
}: ScanMenuModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - only images supported
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setToast({ message: 'Please upload a PNG, JPG, or WEBP image.', type: 'error' })
      return
    }

    // Start processing
    setStep('processing')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/client/menu-scan', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        setToast({ message: data.error || 'Failed to extract menu items', type: 'error' })
        setStep('upload')
        return
      }

      const items = data.data as ExtractedItem[]

      if (items.length === 0) {
        setToast({ message: 'No menu items could be extracted. Try a clearer image.', type: 'error' })
        setStep('upload')
        return
      }

      setExtractedItems(items)
      setStep('review')
    } catch (error) {
      console.error('Menu scan error:', error)
      setToast({ message: 'Failed to process image. Please try again.', type: 'error' })
      setStep('upload')
    }
  }

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImport = async () => {
    if (extractedItems.length === 0) {
      setToast({ message: 'No items to import', type: 'error' })
      return
    }

    setStep('importing')

    try {
      const response = await fetch('/api/client/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: extractedItems }),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: `Successfully imported ${data.data.count} items`, type: 'success' })
        onSuccess()
        handleClose()
      } else {
        setToast({ message: data.error || 'Failed to import items', type: 'error' })
        setStep('review')
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
      setStep('review')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setExtractedItems([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  // Get unique categories from extracted items and existing ones
  const allCategories = Array.from(
    new Set([...existingCategories, ...extractedItems.map((i) => i.category)])
  )

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Scan Menu"
        size="lg"
      >
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upload an image of your menu to automatically extract items.
            </p>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400">PNG, JPG, or WEBP</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Tips for best results:</strong>
              </p>
              <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                <li>Use a clear, high-resolution image</li>
                <li>Ensure text is not blurry or distorted</li>
                <li>Flat, straight photos work better than angled ones</li>
                <li>Review and edit extracted items before importing</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Analyzing menu...
            </p>
            <p className="text-gray-600">AI is extracting menu items from your image</p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                {extractedItems.length} items extracted. Review and edit before importing.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('upload')}
              >
                Re-scan
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {extractedItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(index, 'category', e.target.value)}
                          className="input"
                        >
                          {allCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="input"
                          placeholder="Add description..."
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-2 p-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Total: {extractedItems.length} items
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={extractedItems.length === 0}>
                  Import {extractedItems.length} Items
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 animate-spin">
              <svg className="text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">
              Importing items...
            </p>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}
