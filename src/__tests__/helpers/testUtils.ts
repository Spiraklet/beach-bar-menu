import { NextRequest } from 'next/server'

// Mock data factories
export function createMockClient(overrides = {}) {
  return {
    id: 'test-client-id',
    clientId: '1234',
    companyName: 'Test Beach Bar',
    contactPerson: 'John Doe',
    phone: '+30 123 456 7890',
    email: 'test@beachbar.com',
    passwordHash: '$2a$12$hashedpassword',
    stripeAccountId: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockAdmin(overrides = {}) {
  return {
    id: 'test-admin-id',
    email: 'admin@test.com',
    passwordHash: '$2a$12$hashedpassword',
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockItem(overrides = {}) {
  return {
    id: 'test-item-id',
    itemId: '100',
    clientId: 'test-client-id',
    name: 'Test Item',
    price: 10.00,
    description: 'Test description',
    category: 'Test Category',
    active: true,
    createdAt: new Date(),
    customizations: [],
    ...overrides,
  }
}

export function createMockOrder(overrides = {}) {
  return {
    id: 'test-order-id',
    clientId: 'test-client-id',
    qrCodeId: 'test-qr-id',
    orderNumber: 100000,
    status: 'NEW',
    total: 25.00,
    stripePaymentId: null,
    customerNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockQRCode(overrides = {}) {
  return {
    id: 'test-qr-id',
    clientId: 'test-client-id',
    tableIdentifier: 'A1',
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockStaffSettings(overrides = {}) {
  return {
    id: 'test-staff-settings-id',
    clientId: 'test-client-id',
    staffToken: 'abc12345',
    staffPasswordHash: '$2a$12$hashedpassword', // Hashed version of 'Staff1'
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Request helpers
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options

  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  return request
}

// Mock Prisma client
export function createMockPrismaClient() {
  return {
    client: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    qRCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    staffSettings: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  }
}

// Token payload helpers
export function createTokenPayload(role: 'admin' | 'client' | 'staff', id: string, email: string) {
  return {
    id,
    email,
    role,
  }
}
