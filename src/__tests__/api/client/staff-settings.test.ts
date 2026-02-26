/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  staffSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

// Mock auth functions
const mockGetCurrentUser = jest.fn()
const mockValidateStaffPassword = jest.fn()

jest.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  generateStaffToken: jest.fn().mockResolvedValue('abc12345'),
  validateStaffPassword: (...args: unknown[]) => mockValidateStaffPassword(...args),
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
}))

describe('Staff Settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateStaffPassword.mockReturnValue({ valid: true })
  })

  describe('GET /api/client/staff-settings', () => {
    it('should return null when no settings exist', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue(null)

      const { GET } = await import('@/app/api/client/staff-settings/route')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeNull()
    })

    it('should return settings when they exist', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'abc12345',
        staffPasswordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { GET } = await import('@/app/api/client/staff-settings/route')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.staffToken).toBe('abc12345')
      expect(data.data.hasPassword).toBe(true)
    })

    it('should return 401 for non-client users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'admin-123',
        email: 'admin@test.com',
        role: 'admin',
      })

      const { GET } = await import('@/app/api/client/staff-settings/route')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/client/staff-settings', () => {
    it('should create new staff settings', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue(null)
      mockPrisma.staffSettings.create.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'abc12345',
        staffPasswordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { POST } = await import('@/app/api/client/staff-settings/route')

      const request = new NextRequest('http://localhost:3000/api/client/staff-settings', {
        method: 'POST',
        body: JSON.stringify({ password: 'Staff1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.staffToken).toBe('abc12345')
    })

    it('should return 400 if settings already exist', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue({
        id: 'settings-123',
      })

      const { POST } = await import('@/app/api/client/staff-settings/route')

      const request = new NextRequest('http://localhost:3000/api/client/staff-settings', {
        method: 'POST',
        body: JSON.stringify({ password: 'Staff1' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exist')
    })

    it('should validate password format', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue(null)
      mockValidateStaffPassword.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 6 characters long'],
      })

      const { POST } = await import('@/app/api/client/staff-settings/route')

      const request = new NextRequest('http://localhost:3000/api/client/staff-settings', {
        method: 'POST',
        body: JSON.stringify({ password: 'invalid' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('6 characters')
    })
  })

  describe('PATCH /api/client/staff-settings', () => {
    it('should update staff password', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'abc12345',
      })

      mockPrisma.staffSettings.update.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'abc12345',
        staffPasswordHash: 'new_hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { PATCH } = await import('@/app/api/client/staff-settings/route')

      const request = new NextRequest('http://localhost:3000/api/client/staff-settings', {
        method: 'PATCH',
        body: JSON.stringify({ password: 'NewStaff2' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should regenerate token when requested', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'oldtoken',
      })

      mockPrisma.staffSettings.update.mockResolvedValue({
        id: 'settings-123',
        staffToken: 'abc12345', // New token
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { PATCH } = await import('@/app/api/client/staff-settings/route')

      const request = new NextRequest('http://localhost:3000/api/client/staff-settings', {
        method: 'PATCH',
        body: JSON.stringify({ regenerateToken: true }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.staffToken).toBe('abc12345')
    })
  })

  describe('DELETE /api/client/staff-settings', () => {
    it('should delete staff settings', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue({
        id: 'settings-123',
      })

      mockPrisma.staffSettings.delete.mockResolvedValue({})

      const { DELETE } = await import('@/app/api/client/staff-settings/route')

      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 if settings do not exist', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'client-123',
        email: 'test@beachbar.com',
        role: 'client',
      })

      mockPrisma.staffSettings.findUnique.mockResolvedValue(null)

      const { DELETE } = await import('@/app/api/client/staff-settings/route')

      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })
})
