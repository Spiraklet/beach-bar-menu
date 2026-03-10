import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  hashPassword,
  validateClientPassword,
  validateEmail,
  generateClientId,
} from '@/lib/auth'
import { withAuth, apiError, apiSuccess } from '@/lib/api'
import type { CreateClientInput, UpdateClientInput } from '@/types'

// GET all clients
export const GET = withAuth('admin', async () => {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      clientId: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      stripeAccountId: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
          qrCodes: true,
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiSuccess(clients)
})

// POST create new client
export const POST = withAuth('admin', async (request: NextRequest) => {
  const body: CreateClientInput = await request.json()
  const { companyName, contactPerson, phone, email, password } = body

  // Validation
  if (!companyName || !contactPerson || !phone || !email || !password) {
    return apiError('All fields are required')
  }

  if (!validateEmail(email)) {
    return apiError('Invalid email format')
  }

  const passwordValidation = validateClientPassword(password)
  if (!passwordValidation.valid) {
    return apiError(passwordValidation.errors.join(', '))
  }

  // Check if email exists
  const existingClient = await prisma.client.findUnique({
    where: { email },
  })

  if (existingClient) {
    return apiError('Email already exists')
  }

  // Generate unique client ID and hash password
  const clientId = await generateClientId()
  const passwordHash = await hashPassword(password)

  const client = await prisma.client.create({
    data: {
      clientId,
      companyName,
      contactPerson,
      phone,
      email,
      passwordHash,
    },
    select: {
      id: true,
      clientId: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  })

  return apiSuccess(client, 201)
})

// PATCH update client
export const PATCH = withAuth('admin', async (request: NextRequest) => {
  const body = await request.json()
  const { id, ...updates }: { id: string } & UpdateClientInput = body

  if (!id) {
    return apiError('Client ID is required')
  }

  // Validate email if being updated
  if (updates.email && !validateEmail(updates.email)) {
    return apiError('Invalid email format')
  }

  // Check if new email already exists
  if (updates.email) {
    const existingClient = await prisma.client.findFirst({
      where: {
        email: updates.email,
        NOT: { id },
      },
    })

    if (existingClient) {
      return apiError('Email already exists')
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      clientId: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  })

  return apiSuccess(client)
})

// DELETE client (cascade deletes items, QR codes, orders)
export const DELETE = withAuth('admin', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return apiError('Client ID is required')
  }

  await prisma.client.delete({
    where: { id },
  })

  return apiSuccess()
})
