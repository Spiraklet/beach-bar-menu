/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  client: {
    findUnique: jest.fn(),
  },
  qRCode: {
    findUnique: jest.fn(),
  },
  item: {
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock auth
const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      const mockClient = {
        id: 'client-123',
        clientId: '1234',
      }

      const mockQRCode = {
        id: 'qr-123',
        tableIdentifier: 'A1',
      }

      const mockItem = {
        id: 'item-123',
        name: 'Mojito',
        price: 10.00,
        customizations: [],
      }

      mockPrisma.client.findUnique.mockResolvedValue(mockClient)
      mockPrisma.qRCode.findUnique.mockResolvedValue(mockQRCode)
      mockPrisma.item.findMany.mockResolvedValue([mockItem])
      mockPrisma.order.findFirst.mockResolvedValue(null) // No previous orders
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-123',
        orderNumber: 100000,
        status: 'NEW',
        total: 10.00,
        items: [],
        qrCode: mockQRCode,
      })

      // Import and test
      const { POST } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.orderNumber).toBe(100000)
    })

    it('should return 400 if required fields are missing', async () => {
      const { POST } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          // Missing tableId and items
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 404 if client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null)

      const { POST } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '9999',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should generate sequential order numbers', async () => {
      const mockClient = { id: 'client-123', clientId: '1234' }
      const mockQRCode = { id: 'qr-123', tableIdentifier: 'A1' }
      const mockItem = { id: 'item-123', name: 'Mojito', price: 10.00, customizations: [] }

      mockPrisma.client.findUnique.mockResolvedValue(mockClient)
      mockPrisma.qRCode.findUnique.mockResolvedValue(mockQRCode)
      mockPrisma.item.findMany.mockResolvedValue([mockItem])

      // Simulate existing orders
      mockPrisma.order.findFirst.mockResolvedValue({ orderNumber: 100005 })
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-124',
        orderNumber: 100006,
        status: 'NEW',
        total: 10.00,
      })

      const { POST } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.orderNumber).toBe(100006)
    })
  })

  describe('GET /api/orders', () => {
    it('should return orders for authenticated client', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@test.com',
        role: 'client',
      })

      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 100000,
          status: 'NEW',
          total: 25.00,
        },
      ])

      const { GET } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const { GET } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PATCH /api/orders', () => {
    it('should update order status', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@test.com',
        role: 'client',
      })

      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        clientId: 'client-123',
        status: 'NEW',
      })

      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'PREPARING',
      })

      const { PATCH } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-1',
          status: 'PREPARING',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('PREPARING')
    })

    it('should reject invalid status values', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@test.com',
        role: 'client',
      })

      const { PATCH } = await import('@/app/api/orders/route')

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-1',
          status: 'INVALID_STATUS',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })
  })
})
