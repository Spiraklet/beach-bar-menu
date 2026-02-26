import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET all items for staff user's client
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token-staff')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'staff' || !payload.clientId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const items = await prisma.item.findMany({
      where: { clientId: payload.clientId },
      include: { customizations: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const categories = Array.from(new Set(items.map((item) => item.category)))

    // Count inactive and hidden items
    const inactiveCount = items.filter((item) => !item.active).length
    const hiddenCount = items.filter((item) => item.hidden).length

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories,
        inactiveCount,
        hiddenCount,
      },
    })
  } catch (error) {
    console.error('Get staff items error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH toggle item active/hidden status
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token-staff')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'staff' || !payload.clientId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, active, hidden } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Verify item belongs to the staff's client
    const item = await prisma.item.findFirst({
      where: { id, clientId: payload.clientId },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    const updateData: { active?: boolean; hidden?: boolean } = {}
    if (typeof active === 'boolean') updateData.active = active
    if (typeof hidden === 'boolean') updateData.hidden = hidden

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
      include: { customizations: true },
    })

    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Update staff item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
