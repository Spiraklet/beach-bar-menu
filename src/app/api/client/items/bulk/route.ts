import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, apiError, apiSuccess } from '@/lib/api'

interface BulkItemInput {
  name: string
  price: number
  description: string
  category: string
}

// Generate sequential item ID for bulk imports (001, 002, 003...)
// NOTE: Different from generateItemId in @/lib/auth which generates random 3-digit IDs
async function generateSequentialItemId(clientId: string): Promise<string> {
  const lastItem = await prisma.item.findFirst({
    where: { clientId },
    orderBy: { itemId: 'desc' },
    select: { itemId: true },
  })

  if (!lastItem) return '001'

  const lastNum = parseInt(lastItem.itemId, 10)
  return String(lastNum + 1).padStart(3, '0')
}

export const POST = withAuth('client', async (request: NextRequest, user) => {
  const body = await request.json()
  const { items } = body as { items: BulkItemInput[] }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return apiError('Items array is required')
  }

  // Validate items
  for (const item of items) {
    if (!item.name || item.price === undefined || !item.category) {
      return apiError('Each item must have name, price, and category')
    }
    if (item.price < 0) {
      return apiError('Price cannot be negative')
    }
  }

  // Create items one by one to ensure unique itemIds
  const createdItems = []
  for (const item of items) {
    const itemId = await generateSequentialItemId(user.id)
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

  return apiSuccess({
    count: createdItems.length,
    items: createdItems,
  }, 201)
})
