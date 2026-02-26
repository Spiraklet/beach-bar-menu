/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

// Mock Prisma
const mockPrisma = {
  client: {
    findUnique: jest.fn(),
  },
  loginAttempt: {
    count: jest.fn(),
    create: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock auth functions
const mockCreateToken = jest.fn()
const mockSetAuthCookie = jest.fn()
const mockVerifyPassword = jest.fn()
const mockValidateClientPassword = jest.fn()

jest.mock('@/lib/auth', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  createToken: () => mockCreateToken(),
  setAuthCookie: () => mockSetAuthCookie(),
  validateClientPassword: (...args: unknown[]) => mockValidateClientPassword(...args),
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remainingAttempts: 20 }),
  recordLoginAttempt: jest.fn(),
}))

describe('Client Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login successfully with valid credentials', async () => {
    const mockClient = {
      id: 'client-123',
      clientId: '1234',
      email: 'test@beachbar.com',
      passwordHash: 'hashed_password',
      companyName: 'Test Beach Bar',
    }

    mockPrisma.client.findUnique.mockResolvedValue(mockClient)
    mockValidateClientPassword.mockReturnValue({ valid: true })
    mockVerifyPassword.mockResolvedValue(true)
    mockCreateToken.mockResolvedValue('mock-jwt-token')

    const { POST } = await import('@/app/api/auth/client/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@beachbar.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.companyName).toBe('Test Beach Bar')
  })

  it('should return 400 if email or password is missing', async () => {
    const { POST } = await import('@/app/api/auth/client/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@beachbar.com',
        // Missing password
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 401 for invalid email', async () => {
    mockPrisma.client.findUnique.mockResolvedValue(null)
    mockValidateClientPassword.mockReturnValue({ valid: true })

    const { POST } = await import('@/app/api/auth/client/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@beachbar.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid')
  })

  it('should return 401 for invalid password', async () => {
    const mockClient = {
      id: 'client-123',
      email: 'test@beachbar.com',
      passwordHash: 'hashed_password',
    }

    mockPrisma.client.findUnique.mockResolvedValue(mockClient)
    mockValidateClientPassword.mockReturnValue({ valid: true })
    mockVerifyPassword.mockResolvedValue(false)

    const { POST } = await import('@/app/api/auth/client/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@beachbar.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid')
  })

  it('should enforce rate limiting', async () => {
    // Override the mock for this test
    jest.resetModules()

    jest.mock('@/lib/auth', () => ({
      verifyPassword: jest.fn(),
      createToken: jest.fn(),
      setAuthCookie: jest.fn(),
      checkRateLimit: jest.fn().mockResolvedValue({ allowed: false, remainingAttempts: 0 }),
      recordLoginAttempt: jest.fn(),
    }))

    const { POST } = await import('@/app/api/auth/client/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/client/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@beachbar.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Too many')
  })
})
