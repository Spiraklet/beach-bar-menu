import { Decimal } from '@prisma/client/runtime/library'

export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

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
  categoryOrder: string[] | null
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
  sortOrder: number
  active: boolean
  hidden: boolean
  createdAt: Date
  customizationSections?: CustomizationSection[]
}

export interface CustomizationSection {
  id: string
  itemId: string
  name: string
  required: boolean
  multiSelect: boolean
  sortOrder: number
  options: CustomizationOption[]
}

export interface CustomizationOption {
  id: string
  sectionId: string
  name: string
  price: Decimal | number | string
  sortOrder: number
  available: boolean
  hidden: boolean
}

export interface QRCode {
  id: string
  clientId: string
  tableIdentifier: string
  token: string
  createdAt: Date
}

export interface Order {
  id: string
  clientId: string
  qrCodeId: string
  displayCode: string
  orderNumber: string
  dailySequence: number
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
  note?: string | null
  item?: Item
}

export interface SelectedCustomization {
  optionId: string
  sectionId: string
  sectionName: string
  name: string
  price: number
}

export interface CartItem {
  item: Item
  quantity: number
  selectedCustomizations: SelectedCustomization[]
  subtotal: number
  note?: string
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

export interface SectionInput {
  name: string
  required: boolean
  multiSelect: boolean
  options: { name: string; price: number }[]
}

export interface CreateItemInput {
  name: string
  price: number
  description?: string
  category: string
  sortOrder?: number
  customizationSections?: SectionInput[]
}

export interface UpdateItemInput {
  name?: string
  price?: number
  description?: string
  category?: string
  active?: boolean
  sortOrder?: number
  customizationSections?: SectionInput[]
}

export interface CreateQRCodeInput {
  tableIdentifier: string
}

export interface CreateOrderInput {
  items: {
    itemId: string
    quantity: number
    customizations?: SelectedCustomization[]
    note?: string
  }[]
  customerNote?: string
}
