import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generateStaffToken,
  validateStaffPassword,
  hashPassword,
} from '@/lib/auth'
import { withAuth, apiError, apiNotFound, apiSuccess } from '@/lib/api'

// GET: Retrieve staff settings for logged-in client
export const GET = withAuth('client', async (_request, user) => {
  const staffSettings = await prisma.staffSettings.findUnique({
    where: { clientId: user.id },
  })

  if (!staffSettings) {
    return apiSuccess(null)
  }

  // Don't expose the actual password, just indicate if it's set
  return apiSuccess({
    id: staffSettings.id,
    staffToken: staffSettings.staffToken,
    hasPassword: !!staffSettings.staffPasswordHash,
    createdAt: staffSettings.createdAt,
    updatedAt: staffSettings.updatedAt,
  })
})

// POST: Create staff settings with auto-generated token
export const POST = withAuth('client', async (request: NextRequest, user) => {
  // Check if settings already exist
  const existing = await prisma.staffSettings.findUnique({
    where: { clientId: user.id },
  })

  if (existing) {
    return apiError('Staff settings already exist. Use PATCH to update.')
  }

  const body = await request.json()
  const { password } = body

  if (!password) {
    return apiError('Password is required')
  }

  // Validate password format (6+ chars with letter and number)
  const validation = validateStaffPassword(password)
  if (!validation.valid) {
    return apiError(validation.errors.join(', '))
  }

  // Generate unique token and hash password
  const staffToken = await generateStaffToken()
  const hashedPassword = await hashPassword(password)

  const staffSettings = await prisma.staffSettings.create({
    data: {
      clientId: user.id,
      staffToken,
      staffPasswordHash: hashedPassword,
    },
  })

  return apiSuccess({
    id: staffSettings.id,
    staffToken: staffSettings.staffToken,
    hasPassword: true,
    createdAt: staffSettings.createdAt,
    updatedAt: staffSettings.updatedAt,
  }, 201)
})

// PATCH: Update staff password or regenerate token
export const PATCH = withAuth('client', async (request: NextRequest, user) => {
  const existing = await prisma.staffSettings.findUnique({
    where: { clientId: user.id },
  })

  if (!existing) {
    return apiNotFound('Staff settings')
  }

  const body = await request.json()
  const { password, regenerateToken } = body

  const updateData: { staffPasswordHash?: string; staffToken?: string } = {}

  // Update password if provided
  if (password) {
    const validation = validateStaffPassword(password)
    if (!validation.valid) {
      return apiError(validation.errors.join(', '))
    }
    updateData.staffPasswordHash = await hashPassword(password)
  }

  // Regenerate token if requested
  if (regenerateToken) {
    updateData.staffToken = await generateStaffToken()
  }

  if (Object.keys(updateData).length === 0) {
    return apiError('No updates provided')
  }

  const staffSettings = await prisma.staffSettings.update({
    where: { clientId: user.id },
    data: updateData,
  })

  return apiSuccess({
    id: staffSettings.id,
    staffToken: staffSettings.staffToken,
    hasPassword: true,
    createdAt: staffSettings.createdAt,
    updatedAt: staffSettings.updatedAt,
  })
})

// DELETE: Remove staff settings (disable staff portal)
export const DELETE = withAuth('client', async (_request, user) => {
  const existing = await prisma.staffSettings.findUnique({
    where: { clientId: user.id },
  })

  if (!existing) {
    return apiNotFound('Staff settings')
  }

  await prisma.staffSettings.delete({
    where: { clientId: user.id },
  })

  return apiSuccess()
})
