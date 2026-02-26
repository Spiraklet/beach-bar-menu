/**
 * @jest-environment node
 *
 * Integration tests for the order flow:
 * Customer places order -> Staff sees it -> Staff updates status
 */

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
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
  verifyToken: jest.fn(),
}))

describe('Order Flow Integration', () => {
  const mockClient = {
    id: 'client-123',
    clientId: '1234',
    companyName: 'Test Beach Bar',
  }

  const mockQRCode = {
    id: 'qr-123',
    clientId: 'client-123',
    tableIdentifier: 'A1',
  }

  const mockMenuItem = {
    id: 'item-123',
    name: 'Mojito',
    price: 10.00,
    customizations: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Order Lifecycle', () => {
    it('should process a complete order from creation to completion', async () => {
      // Setup mocks for order creation
      mockPrisma.client.findUnique.mockResolvedValue(mockClient)
      mockPrisma.qRCode.findUnique.mockResolvedValue(mockQRCode)
      mockPrisma.item.findMany.mockResolvedValue([mockMenuItem])
      mockPrisma.order.findFirst.mockResolvedValue(null)

      let createdOrder = {
        id: 'order-123',
        clientId: 'client-123',
        qrCodeId: 'qr-123',
        orderNumber: 100000,
        status: 'NEW',
        total: 10.00,
        items: [{ id: 'orderitem-1', item: mockMenuItem, quantity: 1 }],
        qrCode: mockQRCode,
      }

      mockPrisma.order.create.mockResolvedValue(createdOrder)

      // Step 1: Customer creates order
      const { POST } = await import('@/app/api/orders/route')
      const { NextRequest } = await import('next/server')

      const createRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(createData.success).toBe(true)
      expect(createData.data.orderNumber).toBe(100000)
      expect(createData.data.status).toBe('NEW')

      // Step 2: Staff/Client sees the order and marks it as PREPARING
      const { getCurrentUser } = await import('@/lib/auth')
      ;(getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.order.findFirst.mockResolvedValue(createdOrder)
      mockPrisma.order.update.mockResolvedValue({
        ...createdOrder,
        status: 'PREPARING',
      })

      const { PATCH } = await import('@/app/api/orders/route')

      const prepareRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-123',
          status: 'PREPARING',
        }),
      })

      const prepareResponse = await PATCH(prepareRequest)
      const prepareData = await prepareResponse.json()

      expect(prepareResponse.status).toBe(200)
      expect(prepareData.data.status).toBe('PREPARING')

      // Step 3: Staff marks order as READY
      createdOrder.status = 'PREPARING'
      mockPrisma.order.findFirst.mockResolvedValue(createdOrder)
      mockPrisma.order.update.mockResolvedValue({
        ...createdOrder,
        status: 'READY',
      })

      const readyRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-123',
          status: 'READY',
        }),
      })

      const readyResponse = await PATCH(readyRequest)
      const readyData = await readyResponse.json()

      expect(readyResponse.status).toBe(200)
      expect(readyData.data.status).toBe('READY')

      // Step 4: Staff marks order as COMPLETED
      createdOrder.status = 'READY'
      mockPrisma.order.findFirst.mockResolvedValue(createdOrder)
      mockPrisma.order.update.mockResolvedValue({
        ...createdOrder,
        status: 'COMPLETED',
      })

      const completeRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-123',
          status: 'COMPLETED',
        }),
      })

      const completeResponse = await PATCH(completeRequest)
      const completeData = await completeResponse.json()

      expect(completeResponse.status).toBe(200)
      expect(completeData.data.status).toBe('COMPLETED')
    })

    it('should allow order cancellation at any active status', async () => {
      const { getCurrentUser } = await import('@/lib/auth')
      ;(getCurrentUser as jest.Mock).mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      const orderInProgress = {
        id: 'order-456',
        clientId: 'client-123',
        status: 'PREPARING',
      }

      mockPrisma.order.findFirst.mockResolvedValue(orderInProgress)
      mockPrisma.order.update.mockResolvedValue({
        ...orderInProgress,
        status: 'CANCELLED',
      })

      const { PATCH } = await import('@/app/api/orders/route')
      const { NextRequest } = await import('next/server')

      const cancelRequest = new NextRequest('http://localhost:3000/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'order-456',
          status: 'CANCELLED',
        }),
      })

      const response = await PATCH(cancelRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.status).toBe('CANCELLED')
    })
  })

  describe('Order Number Sequencing', () => {
    it('should generate sequential order numbers for the same client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient)
      mockPrisma.qRCode.findUnique.mockResolvedValue(mockQRCode)
      mockPrisma.item.findMany.mockResolvedValue([mockMenuItem])

      // First order - no previous orders
      mockPrisma.order.findFirst.mockResolvedValueOnce(null)
      mockPrisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        orderNumber: 100000,
        status: 'NEW',
      })

      const { POST } = await import('@/app/api/orders/route')
      const { NextRequest } = await import('next/server')

      const request1 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const response1 = await POST(request1)
      const data1 = await response1.json()

      expect(data1.data.orderNumber).toBe(100000)

      // Second order - previous order exists
      mockPrisma.order.findFirst.mockResolvedValueOnce({ orderNumber: 100000 })
      mockPrisma.order.create.mockResolvedValueOnce({
        id: 'order-2',
        orderNumber: 100001,
        status: 'NEW',
      })

      const request2 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          clientId: '1234',
          tableId: 'A1',
          items: [{ itemId: 'item-123', quantity: 1 }],
        }),
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(data2.data.orderNumber).toBe(100001)
    })
  })
})
