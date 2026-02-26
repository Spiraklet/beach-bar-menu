import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  hashPassword,
  validateClientPassword,
  validateEmail,
  generateClientId,
} from '@/lib/auth'
import type { CreateClientInput, UpdateClientInput } from '@/types'

// GET all clients
export async function GET() {
  try {
    const user = await getCurrentUser('admin')
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('admin')
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateClientInput = await request.json()
    const { companyName, contactPerson, phone, email, password } = body

    // Validation
    if (!companyName || !contactPerson || !phone || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const passwordValidation = validateClientPassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    })

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
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

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update client
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser('admin')
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates }: { id: string } & UpdateClientInput = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Validate email if being updated
    if (updates.email && !validateEmail(updates.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
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
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        )
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

    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE client (cascade deletes items, QR codes, orders)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser('admin')
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      )
    }

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
