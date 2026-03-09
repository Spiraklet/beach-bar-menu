'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button, Modal, Toast, ToastType } from '@/components/ui'
import { formatPrice, groupBy } from '@/lib/utils'
import type { Item, CartItem, SelectedCustomization, CustomizationSection } from '@/types'

type Language = 'en' | 'el'

const translations = {
  en: {
    menu: 'Menu',
    table: 'Table',
    cart: 'Cart',
    addToCart: 'Add to Cart',
    viewCart: 'View Cart',
    checkout: 'Checkout',
    total: 'Total',
    quantity: 'Quantity',
    orderNote: 'Order Note (optional)',
    placeOrder: 'Place Order',
    orderSuccess: 'Order placed successfully!',
    customize: 'Customize',
    itemNote: 'Note for this item',
    noItems: 'No items available',
    notAvailable: 'Not Available',
    emptyCart: 'Your cart is empty',
    items: 'items',
    close: 'Close',
    remove: 'Remove',
    loading: 'Loading...',
    error: 'Error loading menu',
    orderPlaced: 'Order Placed!',
    orderConfirmation: 'Your order has been sent to the kitchen.',
    newOrder: 'Start New Order',
    clearCart: 'Clear Cart',
    clearCartConfirm: 'Are you sure you want to clear your cart?',
    cancel: 'Cancel',
    clear: 'Clear',
    required: 'Required',
    optional: 'Optional',
    selectRequired: 'Please make a selection',
  },
  el: {
    menu: 'Μενού',
    table: 'Τραπέζι',
    cart: 'Καλάθι',
    addToCart: 'Προσθήκη',
    viewCart: 'Καλάθι',
    checkout: 'Ολοκλήρωση',
    total: 'Σύνολο',
    quantity: 'Ποσότητα',
    orderNote: 'Σημείωση (προαιρετικά)',
    placeOrder: 'Καταχώρηση',
    orderSuccess: 'Η παραγγελία καταχωρήθηκε!',
    customize: 'Επιλογές',
    itemNote: 'Σημείωση για αυτό το προϊόν',
    noItems: 'Δεν υπάρχουν προϊόντα',
    notAvailable: 'Μη Διαθέσιμο',
    emptyCart: 'Το καλάθι είναι άδειο',
    items: 'προϊόντα',
    close: 'Κλείσιμο',
    remove: 'Αφαίρεση',
    loading: 'Φόρτωση...',
    error: 'Σφάλμα φόρτωσης',
    orderPlaced: 'Η Παραγγελία Καταχωρήθηκε!',
    orderConfirmation: 'Η παραγγελία σας στάλθηκε στην κουζίνα.',
    newOrder: 'Νέα Παραγγελία',
    clearCart: 'Άδειασμα Καλαθιού',
    clearCartConfirm: 'Είστε σίγουροι ότι θέλετε να αδειάσετε το καλάθι;',
    cancel: 'Ακύρωση',
    clear: 'Άδειασμα',
    required: 'Υποχρεωτικό',
    optional: 'Προαιρετικό',
    selectRequired: 'Παρακαλώ κάντε μια επιλογή',
  },
}

export default function CustomerMenuPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = params.clientId as string
  const tableId = params.tableId as string
  const token = searchParams.get('t') || ''

  const [lang, setLang] = useState<Language>('en')
  const [clientName, setClientName] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const t = translations[lang]

  const fetchMenu = useCallback(async () => {
    try {
      const response = await fetch(`/api/menu/${clientId}`)
      const data = await response.json()

      if (data.success) {
        setClientName(data.data.client.name)
        setItems(data.data.items)
        setCategories(data.data.categories)
      } else {
        setError(data.error || t.error)
      }
    } catch {
      setError(t.error)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, t.error])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items

  const groupedItems = groupBy(filteredItems, 'category')

  // Respect category order from the API
  const orderedCategories = categories.filter((cat) => groupedItems[cat]?.length > 0)

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const openItemModal = (item: Item) => {
    setSelectedItem(item)
    setItemQuantity(1)
    setSelectedCustomizations([])
  }

  const toggleCustomization = (cust: SelectedCustomization, section: CustomizationSection) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.find((c) => c.optionId === cust.optionId)

      if (!section.multiSelect) {
        // Single-select: radio button behavior
        const withoutSection = prev.filter((c) => c.sectionId !== section.id)

        if (exists) {
          // Clicking selected option deselects it (allowed for optional sections)
          return withoutSection
        }
        return [...withoutSection, cust]
      }

      // Multi-select: checkbox behavior
      if (exists) {
        return prev.filter((c) => c.optionId !== cust.optionId)
      }
      return [...prev, cust]
    })
  }

  // Check if all required sections have a selection
  const canAddToCart = () => {
    if (!selectedItem) return false
    const sections = selectedItem.customizationSections || []
    for (const section of sections) {
      if (section.required) {
        const hasSelection = selectedCustomizations.some((c) => c.sectionId === section.id)
        if (!hasSelection) return false
      }
    }
    return true
  }

  // Check which required sections are missing selections
  const missingRequiredSections = () => {
    if (!selectedItem) return []
    const sections = selectedItem.customizationSections || []
    return sections.filter(
      (s) => s.required && !selectedCustomizations.some((c) => c.sectionId === s.id)
    )
  }

  const addToCart = () => {
    if (!selectedItem) return

    const basePrice = Number(selectedItem.price)
    const customizationPrice = selectedCustomizations.reduce((sum, c) => sum + c.price, 0)
    const itemSubtotal = (basePrice + customizationPrice) * itemQuantity

    const newCartItem: CartItem = {
      item: selectedItem,
      quantity: itemQuantity,
      selectedCustomizations,
      subtotal: itemSubtotal,
    }

    setCart((prev) => [...prev, newCartItem])
    setSelectedItem(null)
    setToast({ message: lang === 'en' ? 'Added to cart' : 'Προστέθηκε στο καλάθι', type: 'success' })
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }
    setCart((prev) =>
      prev.map((cartItem, i) => {
        if (i !== index) return cartItem
        const basePrice = Number(cartItem.item.price)
        const customizationPrice = cartItem.selectedCustomizations.reduce((sum, c) => sum + c.price, 0)
        return {
          ...cartItem,
          quantity: newQuantity,
          subtotal: (basePrice + customizationPrice) * newQuantity,
        }
      })
    )
  }

  const updateCartItemNote = (index: number, note: string) => {
    setCart((prev) =>
      prev.map((cartItem, i) => (i === index ? { ...cartItem, note } : cartItem))
    )
  }

  const submitOrder = async () => {
    if (cart.length === 0) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          tableId,
          token,
          items: cart.map((cartItem) => ({
            itemId: cartItem.item.id,
            quantity: cartItem.quantity,
            customizations: cartItem.selectedCustomizations,
            note: cartItem.note || undefined,
          })),
          customerNote: orderNote || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCart([])
        setOrderNote('')
        setIsCheckoutOpen(false)
        // Redirect to secure order view page
        if (data.data.viewToken) {
          router.push(`/order/${data.data.viewToken}`)
        } else {
          setOrderSuccess(true)
          setOrderNumber(data.data.orderNumber)
        }
      } else {
        setToast({ message: data.error || 'Order failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-primary-50 p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.orderPlaced}</h1>
          {orderNumber && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-4 inline-block">
              <p className="text-sm text-gray-500 mb-1">
                {lang === 'en' ? 'Order Number' : 'Αριθμός Παραγγελίας'}
              </p>
              <p className="text-3xl font-bold text-primary-600">#{orderNumber}</p>
            </div>
          )}
          <p className="text-gray-600 mb-8">{t.orderConfirmation}</p>
          <Button onClick={() => { setOrderSuccess(false); setOrderNumber(null); }}>{t.newOrder}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{clientName}</h1>
            <p className="text-sm text-gray-500">{t.table}: {tableId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'el' : 'en')}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200"
            >
              {lang === 'en' ? '🇬🇷 EL' : '🇬🇧 EN'}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="max-w-2xl mx-auto px-4 pb-3 overflow-x-auto">
            <div className="flex gap-2 whitespace-nowrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu Items */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-12">{t.noItems}</p>
        ) : (
          <div className="space-y-8">
            {orderedCategories.map((category) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="space-y-3">
                  {(groupedItems[category] || []).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.active && openItemModal(item)}
                      disabled={!item.active}
                      className={`w-full bg-white rounded-xl p-4 shadow-sm transition-shadow text-left ${
                        item.active ? 'hover:shadow-md' : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            {!item.active && (
                              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                {t.notAvailable}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className={`font-semibold ${item.active ? 'text-primary-600' : 'text-gray-400'}`}>
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
      </main>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2"
            >
              <span className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-medium">
                {cartCount}
              </span>
              <span className="font-medium">{t.viewCart}</span>
            </button>
            <Button onClick={() => setIsCheckoutOpen(true)}>
              {t.checkout} • {formatPrice(cartTotal)}
            </Button>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || ''}
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            {selectedItem.description && (
              <p className="text-gray-600">{selectedItem.description}</p>
            )}

            <p className="text-xl font-semibold text-primary-600">
              {formatPrice(selectedItem.price)}
            </p>

            {/* Customization Sections */}
            {selectedItem.customizationSections && selectedItem.customizationSections.length > 0 && (
              <div className="space-y-4">
                {selectedItem.customizationSections.map((section) => {
                  const sectionMissing = section.required && !selectedCustomizations.some((c) => c.sectionId === section.id)

                  return (
                    <div key={section.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">{section.name}</p>
                        {section.required ? (
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{t.required}</span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{t.optional}</span>
                        )}
                        {!section.multiSelect && (
                          <span className="text-xs text-gray-400">
                            {lang === 'en' ? '(pick one)' : '(επιλέξτε ένα)'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
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
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {section.multiSelect ? (
                                  // Checkbox indicator
                                  <span
                                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                                      isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </span>
                                ) : (
                                  // Radio indicator
                                  <span
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      isSelected ? 'border-primary-600' : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                                    )}
                                  </span>
                                )}
                                <span className="text-sm">{opt.name}</span>
                              </div>
                              {Number(opt.price) > 0 && (
                                <span className="text-sm text-gray-500">+{formatPrice(opt.price)}</span>
                              )}
                              {Number(opt.price) < 0 && (
                                <span className="text-sm text-gray-500">{formatPrice(opt.price)}</span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {sectionMissing && (
                        <p className="text-sm text-red-500 mt-1">{t.selectRequired}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="font-medium text-gray-900 mb-2">{t.quantity}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-xl font-medium w-8 text-center">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={addToCart}
              disabled={!canAddToCart()}
            >
              {t.addToCart} • {formatPrice(
                (Number(selectedItem.price) + selectedCustomizations.reduce((sum, c) => sum + c.price, 0)) * itemQuantity
              )}
            </Button>

            {missingRequiredSections().length > 0 && (
              <p className="text-xs text-center text-red-500">
                {lang === 'en'
                  ? `Please select: ${missingRequiredSections().map((s) => s.name).join(', ')}`
                  : `Παρακαλώ επιλέξτε: ${missingRequiredSections().map((s) => s.name).join(', ')}`}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={`${t.cart} (${cartCount} ${t.items})`}
        size="md"
      >
        {cart.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t.emptyCart}</p>
        ) : (
          <div className="space-y-4">
            {cart.map((cartItem, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cartItem.quantity}x</span>
                    <span>{cartItem.item.name}</span>
                  </div>
                  {cartItem.selectedCustomizations.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {cartItem.selectedCustomizations.map((c) => c.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatPrice(cartItem.subtotal)}</span>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 flex justify-between items-center font-semibold text-lg">
              <span>{t.total}</span>
              <span className="text-primary-600">{formatPrice(cartTotal)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsClearCartModalOpen(true)}
              >
                {t.clearCart}
              </Button>
              <Button className="flex-1" onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>
                {t.checkout}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Cart Confirmation Modal */}
      <Modal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        title={t.clearCart}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t.clearCartConfirm}</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsClearCartModalOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                setCart([])
                setIsClearCartModalOpen(false)
                setIsCartOpen(false)
              }}
            >
              {t.clear}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={t.checkout}
        size="md"
      >
        <div className="space-y-4">
          {/* Editable Order Summary */}
          <div className="space-y-3">
            {cart.map((cartItem, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{cartItem.item.name}</p>
                    {cartItem.selectedCustomizations.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cartItem.selectedCustomizations.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-medium text-sm">{formatPrice(cartItem.subtotal)}</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => updateCartItemQuantity(index, cartItem.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-white"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium w-5 text-center">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateCartItemQuantity(index, cartItem.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-white"
                  >
                    +
                  </button>
                </div>
                {/* Per-item note */}
                <input
                  type="text"
                  value={cartItem.note || ''}
                  onChange={(e) => updateCartItemNote(index, e.target.value)}
                  placeholder={t.itemNote}
                  maxLength={200}
                  className="mt-2 w-full text-xs px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-400 bg-white"
                />
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-3 flex justify-between font-semibold text-lg">
            <span>{t.total}</span>
            <span className="text-primary-600">{formatPrice(cartTotal)}</span>
          </div>

          {/* Order Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.orderNote}
            </label>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="input"
              rows={2}
              placeholder="e.g., No ice, extra lemon..."
            />
          </div>

          <Button className="w-full" onClick={submitOrder} isLoading={isSubmitting} disabled={cart.length === 0}>
            {t.placeOrder}
          </Button>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
