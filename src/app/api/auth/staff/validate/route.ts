import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const staffSettings = await prisma.staffSettings.findUnique({
      where: { staffToken: token },
      include: {
        client: {
          select: {
            companyName: true,
          },
        },
      },
    })

    if (!staffSettings) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        companyName: staffSettings.client.companyName,
      },
    })
  } catch (error) {
    console.error('Staff validate error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
