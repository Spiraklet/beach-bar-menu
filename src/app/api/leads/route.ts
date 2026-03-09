import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const leadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  businessName: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = leadSchema.parse(body)

    await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        businessName: data.businessName || null,
        phone: data.phone || null,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
