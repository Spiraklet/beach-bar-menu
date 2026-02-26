'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button, Modal, Toast, ToastType } from '@/components/ui'
import { formatPrice, groupBy } from '@/lib/utils'
import type { Item, CartItem, SelectedCustomization } from '@/types'

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
    add: 'Add',
    change: 'Change',
    choose: 'Choose one (optional)',
    removeOption: 'Remove',
    clearCart: 'Clear Cart',
    clearCartConfirm: 'Are you sure you want to clear your cart?',
    cancel: 'Cancel',
    clear: 'Clear',
    selectOption: 'Please select an option',
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
    add: 'Προσθήκη',
    change: 'Αλλαγή',
    choose: 'Επιλέξτε ένα (προαιρετικό)',
    removeOption: 'Αφαίρεση',
    clearCart: 'Άδειασμα Καλαθιού',
    clearCartConfirm: 'Είστε σίγουροι ότι θέλετε να αδειάσετε το καλάθι;',
    cancel: 'Ακύρωση',
    clear: 'Άδειασμα',
    selectOption: 'Παρακαλώ επιλέξτε μια επιλογή',
  },
}

export default function CustomerMenuPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const tableId = params.tableId as string

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

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const openItemModal = (item: Item) => {
    setSelectedItem(item)
    setItemQuantity(1)
    setSelectedCustomizations([])
  }

  const toggleCustomization = (cust: SelectedCustomization, allCustomizations?: { id: string; action: string }[]) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.find((c) => c.id === cust.id)

      // CHANGE and CHOOSE both behave as radio buttons (single-select within their group)
      if (cust.action === 'CHANGE' || cust.action === 'CHOOSE') {
        // Get all IDs of the same action group for this item
        const sameActionIds = allCustomizations
          ?.filter((c) => c.action === cust.action)
          .map((c) => c.id) || []

        // Remove any other selection from the same group, then add/toggle this one
        const withoutSameGroup = prev.filter((c) => !sameActionIds.includes(c.id))

        if (exists) {
          // Clicking the selected option again deselects it
          // (CHANGE: deselect allowed here, validation gate prevents cart if nothing selected)
          // (CHOOSE: deselect always allowed — it's optional)
          return withoutSameGroup
        }
        return [...withoutSameGroup, cust]
      }

      // For ADD/REMOVE, allow multi-select (checkbox toggle)
      if (exists) {
        return prev.filter((c) => c.id !== cust.id)
      }
      return [...prev, cust]
    })
  }

  // Check if item requires CHANGE selection
  const hasChangeCustomizations = (item: Item | null) => {
    if (!item?.customizations) return false
    return item.customizations.some((c) => c.action === 'CHANGE')
  }

  // Check if a CHANGE customization is selected
  const hasChangeSelected = () => {
    return selectedCustomizations.some((c) => c.action === 'CHANGE')
  }

  // Can add to cart - must have CHANGE selection if CHANGE options exist
  const canAddToCart = () => {
    if (!selectedItem) return false
    if (!hasChangeCustomizations(selectedItem)) return true
    return hasChangeSelected()
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
          items: cart.map((cartItem) => ({
            itemId: cartItem.item.id,
            quantity: cartItem.quantity,
            customizations: cartItem.selectedCustomizations,
          })),
          customerNote: orderNote || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrderSuccess(true)
        setOrderNumber(data.data.orderNumber)
        setCart([])
        setOrderNote('')
        setIsCheckoutOpen(false)
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
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
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
                          {item.customizations && item.customizations.length > 0 && item.active && (
                            <p className="text-xs text-primary-600 mt-2">
                              {item.customizations.length} {t.customize.toLowerCase()}
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

            {/* Customizations */}
            {selectedItem.customizations && selectedItem.customizations.length > 0 && (
              <div className="space-y-4">
                {/* CHANGE customizations - Radio buttons (single select, required) */}
                {selectedItem.customizations.filter((c) => c.action === 'CHANGE').length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">
                      {t.change} <span className="text-red-500">*</span>
                    </p>
                    <div className="space-y-2">
                      {selectedItem.customizations
                        .filter((cust) => cust.action === 'CHANGE')
                        .map((cust) => {
                          const isSelected = selectedCustomizations.some((c) => c.id === cust.id)
                          return (
                            <button
                              key={cust.id}
                              onClick={() =>
                                toggleCustomization(
                                  {
                                    id: cust.id,
                                    name: cust.name,
                                    price: Number(cust.price),
                                    action: cust.action,
                                  },
                                  selectedItem.customizations
                                )
                              }
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-primary-600' : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                                  )}
                                </span>
                                <span className="text-sm">{cust.name}</span>
                              </div>
                              {Number(cust.price) > 0 && (
                                <span className="text-sm text-gray-500">+{formatPrice(cust.price)}</span>
                              )}
                            </button>
                          )
                        })}
                    </div>
                    {!hasChangeSelected() && (
                      <p className="text-sm text-red-500 mt-1">{t.selectOption}</p>
                    )}
                  </div>
                )}

                {/* CHOOSE customizations - Radio buttons (single-select, optional) */}
                {selectedItem.customizations.filter((c) => c.action === 'CHOOSE').length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{t.choose}</p>
                    <div className="space-y-2">
                      {selectedItem.customizations
                        .filter((cust) => cust.action === 'CHOOSE')
                        .map((cust) => {
                          const isSelected = selectedCustomizations.some((c) => c.id === cust.id)
                          return (
                            <button
                              key={cust.id}
                              onClick={() =>
                                toggleCustomization(
                                  {
                                    id: cust.id,
                                    name: cust.name,
                                    price: Number(cust.price),
                                    action: cust.action,
                                  },
                                  selectedItem.customizations
                                )
                              }
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-primary-600' : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                                  )}
                                </span>
                                <span className="text-sm">{cust.name}</span>
                              </div>
                              {Number(cust.price) > 0 && (
                                <span className="text-sm text-gray-500">+{formatPrice(cust.price)}</span>
                              )}
                            </button>
                          )
                        })}
                    </div>
                    {/* No required validation message — CHOOSE is optional */}
                  </div>
                )}

                {/* ADD customizations - Checkboxes (multi-select, optional) */}
                {selectedItem.customizations.filter((c) => c.action === 'ADD').length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{t.add}</p>
                    <div className="space-y-2">
                      {selectedItem.customizations
                        .filter((cust) => cust.action === 'ADD')
                        .map((cust) => {
                          const isSelected = selectedCustomizations.some((c) => c.id === cust.id)
                          return (
                            <button
                              key={cust.id}
                              onClick={() =>
                                toggleCustomization({
                                  id: cust.id,
                                  name: cust.name,
                                  price: Number(cust.price),
                                  action: cust.action,
                                })
                              }
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
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
                                <span className="text-sm">{cust.name}</span>
                              </div>
                              {Number(cust.price) > 0 && (
                                <span className="text-sm text-gray-500">+{formatPrice(cust.price)}</span>
                              )}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* REMOVE customizations - Checkboxes (multi-select, optional) */}
                {selectedItem.customizations.filter((c) => c.action === 'REMOVE').length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{t.removeOption}</p>
                    <div className="space-y-2">
                      {selectedItem.customizations
                        .filter((cust) => cust.action === 'REMOVE')
                        .map((cust) => {
                          const isSelected = selectedCustomizations.some((c) => c.id === cust.id)
                          return (
                            <button
                              key={cust.id}
                              onClick={() =>
                                toggleCustomization({
                                  id: cust.id,
                                  name: cust.name,
                                  price: Number(cust.price),
                                  action: cust.action,
                                })
                              }
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
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
                                <span className="text-sm">{cust.name}</span>
                              </div>
                              {Number(cust.price) !== 0 && (
                                <span className="text-sm text-gray-500">{formatPrice(cust.price)}</span>
                              )}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
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
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            {cart.map((cartItem, index) => (
              <div key={index} className="flex justify-between py-2">
                <span>
                  {cartItem.quantity}x {cartItem.item.name}
                </span>
                <span>{formatPrice(cartItem.subtotal)}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
              <span>{t.total}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
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
              rows={3}
              placeholder="e.g., No ice, extra lemon..."
            />
          </div>

          <Button className="w-full" onClick={submitOrder} isLoading={isSubmitting}>
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
