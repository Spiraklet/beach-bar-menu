import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth, apiError, apiSuccess } from '@/lib/api'

// PATCH - reorder items, categories, sections, or options
export const PATCH = withAuth('client', async (request: NextRequest, user) => {
  const body = await request.json()
  const { type } = body

  switch (type) {
    case 'items': {
      // body.items: Array<{ id: string, sortOrder: number }>
      const { items } = body
      if (!Array.isArray(items)) {
        return apiError('Items array required')
      }

      await prisma.$transaction(
        items.map((item: { id: string; sortOrder: number }) =>
          prisma.item.updateMany({
            where: { id: item.id, clientId: user.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      )
      break
    }

    case 'categories': {
      // body.categoryOrder: string[]
      const { categoryOrder } = body
      if (!Array.isArray(categoryOrder)) {
        return apiError('categoryOrder array required')
      }

      await prisma.client.update({
        where: { id: user.id },
        data: { categoryOrder },
      })
      break
    }

    case 'sections': {
      // body.sections: Array<{ id: string, sortOrder: number }>
      const { sections } = body
      if (!Array.isArray(sections)) {
        return apiError('Sections array required')
      }

      // Verify sections belong to client's items
      await prisma.$transaction(
        sections.map((section: { id: string; sortOrder: number }) =>
          prisma.customizationSection.updateMany({
            where: {
              id: section.id,
              item: { clientId: user.id },
            },
            data: { sortOrder: section.sortOrder },
          })
        )
      )
      break
    }

    case 'options': {
      // body.options: Array<{ id: string, sortOrder: number }>
      const { options } = body
      if (!Array.isArray(options)) {
        return apiError('Options array required')
      }

      // Verify options belong to client's items
      await prisma.$transaction(
        options.map((option: { id: string; sortOrder: number }) =>
          prisma.customizationOption.updateMany({
            where: {
              id: option.id,
              section: { item: { clientId: user.id } },
            },
            data: { sortOrder: option.sortOrder },
          })
        )
      )
      break
    }

    default:
      return apiError('Invalid reorder type')
  }

  return apiSuccess()
})
