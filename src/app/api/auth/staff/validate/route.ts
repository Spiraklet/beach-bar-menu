import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError, apiNotFound, apiServerError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return apiError('Token is required')
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
      return apiNotFound('Token')
    }

    return apiSuccess({
      companyName: staffSettings.client.companyName,
    })
  } catch (error) {
    return apiServerError('Staff validate error', error)
  }
}
