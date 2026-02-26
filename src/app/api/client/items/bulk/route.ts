import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface BulkItemInput {
  name: string
  price: number
  description: string
  category: string
}

// Generate sequential item ID for a client
async function generateItemId(clientId: string): Promise<string> {
  const lastItem = await prisma.item.findFirst({
    where: { clientId },
    orderBy: { itemId: 'desc' },
    select: { itemId: true },
  })

  if (!lastItem) return '001'

  const lastNum = parseInt(lastItem.itemId, 10)
  return String(lastNum + 1).padStart(3, '0')
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items } = body as { items: BulkItemInput[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.name || item.price === undefined || !item.category) {
        return NextResponse.json(
          { success: false, error: 'Each item must have name, price, and category' },
          { status: 400 }
        )
      }
      if (item.price < 0) {
        return NextResponse.json(
          { success: false, error: 'Price cannot be negative' },
          { status: 400 }
        )
      }
    }

    // Create items one by one to ensure unique itemIds
    const createdItems = []
    for (const item of items) {
      const itemId = await generateItemId(user.id)
      const created = await prisma.item.create({
        data: {
          clientId: user.id,
          itemId,
          name: item.name,
          price: item.price,
          description: item.description || null,
          category: item.category,
          active: true,
          hidden: false,
        },
      })
      createdItems.push(created)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          count: createdItems.length,
          items: createdItems,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Bulk create items error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
