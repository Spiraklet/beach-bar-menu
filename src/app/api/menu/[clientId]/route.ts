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
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Fetch visible items (not hidden), including inactive ones to show "Not Available"
    const items = await prisma.item.findMany({
      where: {
        clientId: client.id,
        hidden: false,
      },
      include: {
        customizations: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const categories = Array.from(new Set(items.map((item) => item.category)))

    return NextResponse.json({
      success: true,
      data: {
        client: {
          clientId: client.clientId,
          name: client.companyName,
        },
        items,
        categories,
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
