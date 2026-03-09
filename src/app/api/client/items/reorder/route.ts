import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH - reorder items, categories, sections, or options
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
    const { type } = body

    switch (type) {
      case 'items': {
        // body.items: Array<{ id: string, sortOrder: number }>
        const { items } = body
        if (!Array.isArray(items)) {
          return NextResponse.json(
            { success: false, error: 'Items array required' },
            { status: 400 }
          )
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
          return NextResponse.json(
            { success: false, error: 'categoryOrder array required' },
            { status: 400 }
          )
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
          return NextResponse.json(
            { success: false, error: 'Sections array required' },
            { status: 400 }
          )
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
          return NextResponse.json(
            { success: false, error: 'Options array required' },
            { status: 400 }
          )
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
        return NextResponse.json(
          { success: false, error: 'Invalid reorder type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
