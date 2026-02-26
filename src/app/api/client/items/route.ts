// @refresh reset
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, generateItemId } from '@/lib/auth'
import type { CreateItemInput, UpdateItemInput } from '@/types'

// GET all items for client
export async function GET() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const items = await prisma.item.findMany({
      where: { clientId: client.id },
      include: {
        customizations: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // Get unique categories
    const categories = Array.from(new Set(items.map(item => item.category)))

    return NextResponse.json({ success: true, data: { items, categories } })
  } catch (error) {
    console.error('Get items error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new item
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const body: CreateItemInput = await request.json()
    const { name, price, description, category, customizations } = body

    if (!name || price === undefined || !category) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    // Generate unique item ID
    const itemId = await generateItemId(client.id)

    const item = await prisma.item.create({
      data: {
        itemId,
        clientId: client.id,
        name,
        price,
        description,
        category,
        customizations: customizations
          ? {
              create: customizations.map((c) => ({
                name: c.name,
                price: c.price,
                action: c.action,
              })),
            }
          : undefined,
      },
      include: {
        customizations: true,
      },
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update item
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, customizations, ...updates }: { id: string; customizations?: UpdateItemInput['customizations'] } & Omit<UpdateItemInput, 'customizations'> = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Verify item belongs to client
    const existingItem = await prisma.item.findFirst({
      where: { id, client: { id: user.id } },
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Update item and customizations in a transaction
    const item = await prisma.$transaction(async (tx) => {
      // Delete existing customizations if new ones provided
      if (customizations) {
        await tx.itemCustomization.deleteMany({
          where: { itemId: id },
        })
      }

      return tx.item.update({
        where: { id },
        data: {
          ...updates,
          customizations: customizations
            ? {
                create: customizations.map((c) => ({
                  name: c.name,
                  price: c.price,
                  action: c.action,
                })),
              }
            : undefined,
        },
        include: {
          customizations: true,
        },
      })
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE item
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Verify item belongs to client
    const item = await prisma.item.findFirst({
      where: { id, client: { id: user.id } },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    await prisma.item.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
