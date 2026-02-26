/**
 * @jest-environment node
 */

import {
  validateAdminPassword,
  validateClientPassword,
  validateEmail,
  validateStaffPassword,
} from '@/lib/auth'

// Mock prisma for the generateStaffToken function
jest.mock('@/lib/db', () => ({
  prisma: {
    staffSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    client: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    item: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}))

describe('Auth Validation Functions', () => {
  describe('validateAdminPassword', () => {
    it('should accept valid password with all requirements', () => {
      const result = validateAdminPassword('Admin123!@#')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 10 characters', () => {
      const result = validateAdminPassword('Admin1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 10 characters long')
    })

    it('should reject password without uppercase', () => {
      const result = validateAdminPassword('admin12345!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase', () => {
      const result = validateAdminPassword('ADMIN12345!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without number', () => {
      const result = validateAdminPassword('AdminAdmin!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special character', () => {
      const result = validateAdminPassword('AdminAdmin1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should return multiple errors for multiple violations', () => {
      const result = validateAdminPassword('admin')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('validateClientPassword', () => {
    it('should accept valid 6-digit password', () => {
      const result = validateClientPassword('123456')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject password with less than 6 digits', () => {
      const result = validateClientPassword('12345')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('6 digits')
    })

    it('should reject password with more than 6 digits', () => {
      const result = validateClientPassword('1234567')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('6 digits')
    })

    it('should reject password with non-digit characters', () => {
      const result = validateClientPassword('12345a')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('6 digits')
    })
  })

  describe('validateStaffPassword', () => {
    it('should accept valid 6-digit password', () => {
      const result = validateStaffPassword('123456')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid passwords', () => {
      const result = validateStaffPassword('abc123')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('6 digits')
    })
  })

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@nodomain.com')).toBe(false)
      expect(validateEmail('spaces in@email.com')).toBe(false)
    })
  })
})

describe('Token Generation', () => {
  describe('generateStaffToken', () => {
    it('should generate an 8-character alphanumeric token', async () => {
      const { generateStaffToken } = await import('@/lib/auth')
      const token = await generateStaffToken()

      expect(token).toHaveLength(8)
      expect(/^[a-z0-9]+$/.test(token)).toBe(true)
    })
  })
})
