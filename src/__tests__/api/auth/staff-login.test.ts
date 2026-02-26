/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  staffSettings: {
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
jest.mock('@/lib/auth', () => ({
  verifyPassword: jest.fn(),
  createToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  setAuthCookie: jest.fn(),
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remainingAttempts: 20 }),
  recordLoginAttempt: jest.fn(),
}))

describe('Staff Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login successfully with valid token and password', async () => {
    const mockStaffSettings = {
      id: 'staff-123',
      staffToken: 'abc12345',
      staffPasswordHash: 'hashed_password',
      client: {
        id: 'client-123',
        email: 'client@beachbar.com',
        companyName: 'Test Beach Bar',
      },
    }

    mockPrisma.staffSettings.findUnique.mockResolvedValue(mockStaffSettings)

    const { verifyPassword } = await import('@/lib/auth')
    ;(verifyPassword as jest.Mock).mockResolvedValue(true)

    const { POST } = await import('@/app/api/auth/staff/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({
        token: 'abc12345',
        password: 'Staff1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.companyName).toBe('Test Beach Bar')
  })

  it('should return 400 if token or password is missing', async () => {
    const { POST } = await import('@/app/api/auth/staff/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({
        token: 'abc12345',
        // Missing password
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 401 for invalid token', async () => {
    mockPrisma.staffSettings.findUnique.mockResolvedValue(null)

    const { POST } = await import('@/app/api/auth/staff/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalidtoken',
        password: 'Staff1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid')
  })

  it('should return 401 for invalid password', async () => {
    const mockStaffSettings = {
      id: 'staff-123',
      staffToken: 'abc12345',
      staffPasswordHash: 'hashed_password',
      client: {
        id: 'client-123',
        email: 'client@beachbar.com',
        companyName: 'Test Beach Bar',
      },
    }

    mockPrisma.staffSettings.findUnique.mockResolvedValue(mockStaffSettings)

    const { verifyPassword } = await import('@/lib/auth')
    ;(verifyPassword as jest.Mock).mockResolvedValue(false)

    const { POST } = await import('@/app/api/auth/staff/login/route')

    const request = new NextRequest('http://localhost:3000/api/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({
        token: 'abc12345',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid password')
  })
})
