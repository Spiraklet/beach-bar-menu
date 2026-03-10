// @refresh reset
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateItemId } from '@/lib/auth'
import { withAuth, apiError, apiNotFound, apiSuccess } from '@/lib/api'
import type { CreateItemInput, UpdateItemInput } from '@/types'

const SECTIONS_INCLUDE = {
  customizationSections: {
    include: { options: { orderBy: { sortOrder: 'asc' as const } } },
    orderBy: { sortOrder: 'asc' as const },
  },
}

// GET all items for client
export const GET = withAuth('client', async (_request, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
  }

  const items = await prisma.item.findMany({
    where: { clientId: client.id },
    include: SECTIONS_INCLUDE,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })

  // Get unique categories in order
  const categoryOrder = (client.categoryOrder as string[] | null) || []
  const allCategories = Array.from(new Set(items.map(item => item.category)))
  // Ordered categories first, then any new ones alphabetically
  const orderedCategories = [
    ...categoryOrder.filter(c => allCategories.includes(c)),
    ...allCategories.filter(c => !categoryOrder.includes(c)).sort(),
  ]

  return apiSuccess({ items, categories: orderedCategories, categoryOrder })
})

// POST create new item
export const POST = withAuth('client', async (request: NextRequest, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
  }

  const body: CreateItemInput = await request.json()
  const { name, price, description, category, sortOrder, customizationSections } = body

  const parsedPrice = Number(price)
  if (!name || isNaN(parsedPrice) || parsedPrice < 0 || !category) {
    return apiError('Name, price (>= 0), and category are required')
  }

  // Generate unique item ID
  const itemId = await generateItemId(client.id)

  const item = await prisma.item.create({
    data: {
      itemId,
      clientId: client.id,
      name,
      price: parsedPrice,
      description,
      category,
      sortOrder: sortOrder ?? 0,
      customizationSections: customizationSections
        ? {
            create: customizationSections.map((section, sIdx) => ({
              name: section.name,
              required: section.required,
              multiSelect: section.multiSelect,
              sortOrder: sIdx,
              options: {
                create: section.options.map((opt, oIdx) => ({
                  name: opt.name,
                  price: opt.price,
                  sortOrder: oIdx,
                })),
              },
            })),
          }
        : undefined,
    },
    include: SECTIONS_INCLUDE,
  })

  return apiSuccess(item, 201)
})

// PATCH update item
export const PATCH = withAuth('client', async (request: NextRequest, user) => {
  const body = await request.json()
  const { id, customizationSections, ...updates }: {
    id: string
    customizationSections?: UpdateItemInput['customizationSections']
  } & Omit<UpdateItemInput, 'customizationSections'> = body

  if (!id) {
    return apiError('Item ID is required')
  }

  // Verify item belongs to client
  const existingItem = await prisma.item.findFirst({
    where: { id, client: { id: user.id } },
  })

  if (!existingItem) {
    return apiNotFound('Item')
  }

  // Update item and customization sections in a transaction
  const item = await prisma.$transaction(async (tx) => {
    // Delete existing sections (cascades to options) if new ones provided
    if (customizationSections) {
      await tx.customizationSection.deleteMany({
        where: { itemId: id },
      })
    }

    return tx.item.update({
      where: { id },
      data: {
        ...updates,
        customizationSections: customizationSections
          ? {
              create: customizationSections.map((section, sIdx) => ({
                name: section.name,
                required: section.required,
                multiSelect: section.multiSelect,
                sortOrder: sIdx,
                options: {
                  create: section.options.map((opt, oIdx) => ({
                    name: opt.name,
                    price: opt.price,
                    sortOrder: oIdx,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: SECTIONS_INCLUDE,
    })
  })

  return apiSuccess(item)
})

// DELETE item
export const DELETE = withAuth('client', async (request: NextRequest, user) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return apiError('Item ID is required')
  }

  // Verify item belongs to client
  const item = await prisma.item.findFirst({
    where: { id, client: { id: user.id } },
  })

  if (!item) {
    return apiNotFound('Item')
  }

  await prisma.item.delete({ where: { id } })

  return apiSuccess()
})
