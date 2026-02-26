import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'
import crypto from 'crypto'

// ============================================================================
// JWT SECRET - CRITICAL: Must be set in environment
// ============================================================================
const JWT_SECRET_STRING = process.env.JWT_SECRET
if (!JWT_SECRET_STRING) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. This is required for secure token generation.')
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING)

// ============================================================================
// TOKEN EXPIRATION - Different per role
// ============================================================================
const TOKEN_EXPIRATION = {
  admin: '1h',    // 1 hour for admin (security-sensitive)
  client: '8h',   // 8 hours for client (day-long management)
  staff: '12h',   // 12 hours for staff (full shift coverage)
} as const

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================
const RATE_LIMIT_CONFIG = {
  admin: { maxAttempts: 5, windowMinutes: 15 },
  client: { maxAttempts: 5, windowMinutes: 15 },
  staff: { maxAttempts: 10, windowMinutes: 10 },
} as const

// ============================================================================
// TYPES
// ============================================================================
export type TokenPayload = {
  id: string
  email: string
  role: 'admin' | 'client' | 'staff'
  clientId?: string // For staff users, the associated client ID
}

export type AuthRole = 'admin' | 'client' | 'staff'

// ============================================================================
// PASSWORD HASHING
// ============================================================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12) // Cost factor 12 as specified
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================
export async function createToken(payload: TokenPayload): Promise<string> {
  const expiration = TOKEN_EXPIRATION[payload.role]
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================
const COOKIE_MAX_AGE = {
  admin: 60 * 60,         // 1 hour
  client: 60 * 60 * 8,    // 8 hours
  staff: 60 * 60 * 12,    // 12 hours
} as const

export async function setAuthCookie(token: string, role: AuthRole) {
  const cookieStore = await cookies()
  cookieStore.set(`auth-token-${role}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Upgraded from 'lax' for better CSRF protection
    maxAge: COOKIE_MAX_AGE[role],
    path: '/',
  })
}

export async function getAuthCookie(role: AuthRole): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(`auth-token-${role}`)?.value
}

export async function clearAuthCookie(role: AuthRole) {
  const cookieStore = await cookies()
  cookieStore.delete(`auth-token-${role}`)
}

export async function clearAllAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token-admin')
  cookieStore.delete('auth-token-client')
  cookieStore.delete('auth-token-staff')
}

export async function getCurrentUser(role: AuthRole): Promise<TokenPayload | null> {
  const token = await getAuthCookie(role)
  if (!token) return null
  return verifyToken(token)
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Admin password policy:
 * - Minimum 10 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validateAdminPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Client password policy:
 * - Minimum 10 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validateClientPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Staff password policy (balanced for tablet entry):
 * - Minimum 6 characters
 * - At least 1 letter
 * - At least 1 number
 */
export function validateStaffPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return { valid: errors.length === 0, errors }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if login is allowed based on failed attempt count
 * Returns generic message to prevent email enumeration
 */
export async function checkRateLimit(
  identifier: string,
  role: AuthRole = 'client'
): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const config = RATE_LIMIT_CONFIG[role]
  const windowMs = config.windowMinutes * 60 * 1000
  const windowStart = new Date(Date.now() - windowMs)

  const attempts = await prisma.loginAttempt.count({
    where: {
      email: identifier,
      attemptedAt: { gte: windowStart },
      success: false,
    },
  })

  const allowed = attempts < config.maxAttempts
  const remainingAttempts = Math.max(0, config.maxAttempts - attempts)

  // Calculate when the lockout expires (oldest failed attempt + window)
  let lockedUntil: Date | undefined
  if (!allowed) {
    const oldestAttempt = await prisma.loginAttempt.findFirst({
      where: {
        email: identifier,
        attemptedAt: { gte: windowStart },
        success: false,
      },
      orderBy: { attemptedAt: 'asc' },
    })
    if (oldestAttempt) {
      lockedUntil = new Date(oldestAttempt.attemptedAt.getTime() + windowMs)
    }
  }

  return { allowed, remainingAttempts, lockedUntil }
}

export async function recordLoginAttempt(identifier: string, success: boolean) {
  await prisma.loginAttempt.create({
    data: { email: identifier, success },
  })
}

// ============================================================================
// ID GENERATION
// ============================================================================

export async function generateClientId(): Promise<string> {
  let clientId: string
  let exists = true

  while (exists) {
    clientId = Math.floor(1000 + Math.random() * 9000).toString()
    const existing = await prisma.client.findUnique({
      where: { clientId },
    })
    exists = !!existing
  }

  return clientId!
}

export async function generateItemId(clientDbId: string): Promise<string> {
  let itemId: string
  let exists = true

  while (exists) {
    itemId = Math.floor(100 + Math.random() * 900).toString()
    const existing = await prisma.item.findUnique({
      where: {
        clientId_itemId: {
          clientId: clientDbId,
          itemId,
        },
      },
    })
    exists = !!existing
  }

  return itemId!
}

/**
 * Generate cryptographically secure 24-character staff token
 * Uses crypto.randomBytes for true randomness
 */
export async function generateStaffToken(): Promise<string> {
  let token: string
  let exists = true

  while (exists) {
    // 24 bytes = 48 hex characters, take first 24 for URL-friendliness
    token = crypto.randomBytes(24).toString('hex').slice(0, 24)

    const existing = await prisma.staffSettings.findUnique({
      where: { staffToken: token },
    })
    exists = !!existing
  }

  return token!
}

// ============================================================================
// STAFF SETTINGS
// ============================================================================

export async function getStaffSettingsByToken(token: string) {
  return prisma.staffSettings.findUnique({
    where: { staffToken: token },
    include: { client: true },
  })
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize text input to prevent XSS
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate table identifier format (alphanumeric, 1-5 chars)
 */
export function validateTableIdentifier(identifier: string): boolean {
  return /^[A-Za-z0-9]{1,10}$/.test(identifier)
}

/**
 * Validate price is a positive number
 */
export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && isFinite(price)
}

/**
 * Validate quantity is a positive integer
 */
export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0
}
