import { Decimal } from '@prisma/client/runtime/library'

export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
export type CustomizationAction = 'ADD' | 'CHANGE' | 'REMOVE' | 'CHOOSE'

export interface Admin {
  id: string
  email: string
  createdAt: Date
}

export interface Client {
  id: string
  clientId: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  stripeAccountId: string | null
  createdAt: Date
}

export interface Item {
  id: string
  itemId: string
  clientId: string
  name: string
  price: Decimal | number | string
  description: string | null
  category: string
  active: boolean
  hidden: boolean
  createdAt: Date
  customizations?: ItemCustomization[]
}

export interface ItemCustomization {
  id: string
  itemId: string
  name: string
  price: Decimal | number | string
  action: CustomizationAction
}

export interface QRCode {
  id: string
  clientId: string
  tableIdentifier: string
  createdAt: Date
}

export interface Order {
  id: string
  clientId: string
  qrCodeId: string
  orderNumber: number
  status: OrderStatus
  total: Decimal | number | string
  stripePaymentId: string | null
  customerNote: string | null
  createdAt: Date
  updatedAt: Date
  doneAt: Date | null
  items?: OrderItem[]
  qrCode?: QRCode
}

export interface StaffSettings {
  id: string
  clientId: string
  staffToken: string
  staffPasswordHash: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  itemId: string
  quantity: number
  customizations: SelectedCustomization[] | null
  subtotal: Decimal | number | string
  item?: Item
}

export interface SelectedCustomization {
  id: string
  name: string
  price: number
  action: CustomizationAction
}

export interface CartItem {
  item: Item
  quantity: number
  selectedCustomizations: SelectedCustomization[]
  subtotal: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface CreateClientInput {
  companyName: string
  contactPerson: string
  phone: string
  email: string
  password: string
}

export interface UpdateClientInput {
  companyName?: string
  contactPerson?: string
  phone?: string
  email?: string
}

export interface CreateItemInput {
  name: string
  price: number
  description?: string
  category: string
  customizations?: Omit<ItemCustomization, 'id' | 'itemId'>[]
}

export interface UpdateItemInput {
  name?: string
  price?: number
  description?: string
  category?: string
  active?: boolean
  customizations?: Omit<ItemCustomization, 'id' | 'itemId'>[]
}

export interface CreateQRCodeInput {
  tableIdentifier: string
}

export interface CreateOrderInput {
  items: {
    itemId: string
    quantity: number
    customizations?: SelectedCustomization[]
  }[]
  customerNote?: string
}
