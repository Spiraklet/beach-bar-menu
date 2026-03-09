import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params

    const client = await prisma.client.findUnique({
      where: { clientId },
      select: {
        id: true,
        clientId: true,
        companyName: true,
        categoryOrder: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Fetch visible items (not hidden), including inactive ones to show "Not Available"
    // Hidden customization options are excluded; unavailable ones are kept (shown greyed out)
    const items = await prisma.item.findMany({
      where: {
        clientId: client.id,
        hidden: false,
      },
      include: {
        customizationSections: {
          include: {
            options: {
              where: { hidden: false },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    // Order categories: use client's saved order, then alphabetically for new ones
    const categoryOrder = (client.categoryOrder as string[] | null) || []
    const allCategories = Array.from(new Set(items.map((item) => item.category)))
    const categories = [
      ...categoryOrder.filter((c) => allCategories.includes(c)),
      ...allCategories.filter((c) => !categoryOrder.includes(c)).sort(),
    ]

    return NextResponse.json({
      success: true,
      data: {
        client: {
          clientId: client.clientId,
          name: client.companyName,
        },
        items,
        categories,
        categoryOrder,
      },
    })
  } catch (error) {
    console.error('Get menu error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
