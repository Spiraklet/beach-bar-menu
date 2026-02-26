import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getCurrentUser,
  generateStaffToken,
  validateStaffPassword,
  hashPassword,
} from '@/lib/auth'

// GET: Retrieve staff settings for logged-in client
export async function GET() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const staffSettings = await prisma.staffSettings.findUnique({
      where: { clientId: user.id },
    })

    if (!staffSettings) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    // Don't expose the actual password, just indicate if it's set
    return NextResponse.json({
      success: true,
      data: {
        id: staffSettings.id,
        staffToken: staffSettings.staffToken,
        hasPassword: !!staffSettings.staffPasswordHash,
        createdAt: staffSettings.createdAt,
        updatedAt: staffSettings.updatedAt,
      },
    })
  } catch (error) {
    console.error('Get staff settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create staff settings with auto-generated token
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if settings already exist
    const existing = await prisma.staffSettings.findUnique({
      where: { clientId: user.id },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Staff settings already exist. Use PATCH to update.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Validate password format (6+ chars with letter and number)
    const validation = validateStaffPassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: staffSettings.id,
          staffToken: staffSettings.staffToken,
          hasPassword: true,
          createdAt: staffSettings.createdAt,
          updatedAt: staffSettings.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create staff settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update staff password or regenerate token
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existing = await prisma.staffSettings.findUnique({
      where: { clientId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Staff settings not found. Create them first.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { password, regenerateToken } = body

    const updateData: { staffPasswordHash?: string; staffToken?: string } = {}

    // Update password if provided
    if (password) {
      const validation = validateStaffPassword(password)
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
      updateData.staffPasswordHash = await hashPassword(password)
    }

    // Regenerate token if requested
    if (regenerateToken) {
      updateData.staffToken = await generateStaffToken()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      )
    }

    const staffSettings = await prisma.staffSettings.update({
      where: { clientId: user.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: staffSettings.id,
        staffToken: staffSettings.staffToken,
        hasPassword: true,
        createdAt: staffSettings.createdAt,
        updatedAt: staffSettings.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update staff settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove staff settings (disable staff portal)
export async function DELETE() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existing = await prisma.staffSettings.findUnique({
      where: { clientId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Staff settings not found' },
        { status: 404 }
      )
    }

    await prisma.staffSettings.delete({
      where: { clientId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete staff settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
