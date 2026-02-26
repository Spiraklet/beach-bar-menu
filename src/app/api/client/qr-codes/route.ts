import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, validateTableIdentifier } from '@/lib/auth'
import QRCode from 'qrcode'

// GET all QR codes for client
export async function GET() {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const qrCodes = await prisma.qRCode.findMany({
      where: { clientId: client.id },
      orderBy: { tableIdentifier: 'asc' },
    })

    // Generate QR code data URLs
    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qr) => {
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/${client.clientId}/${qr.tableIdentifier}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })

        return {
          ...qr,
          url,
          dataUrl,
        }
      })
    )

    return NextResponse.json({ success: true, data: qrCodesWithImages })
  } catch (error) {
    console.error('Get QR codes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new QR code(s)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tableIdentifiers } = body as { tableIdentifiers: string[] }

    if (!tableIdentifiers || tableIdentifiers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Table identifiers are required' },
        { status: 400 }
      )
    }

    // Normalise all identifiers to uppercase so that A1 and a1 are treated
    // as the same table, preventing case-sensitivity inconsistencies.
    const normalisedIdentifiers = tableIdentifiers.map((id) => id.trim().toUpperCase())

    // Validate each identifier format
    const invalidIdentifiers = normalisedIdentifiers.filter((id) => !validateTableIdentifier(id))
    if (invalidIdentifiers.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid table identifiers: ${invalidIdentifiers.join(', ')}. Use only letters and numbers (max 10 characters).` },
        { status: 400 }
      )
    }

    // Check for duplicates within the submitted batch itself
    const uniqueInBatch = new Set(normalisedIdentifiers)
    if (uniqueInBatch.size !== normalisedIdentifiers.length) {
      return NextResponse.json(
        { success: false, error: 'Duplicate table identifiers in request' },
        { status: 400 }
      )
    }

    // Look up ALL existing QR codes for these identifiers, including
    // soft-deleted ones. We need the full picture to decide what to do.
    const existingQRs = await prisma.$queryRaw<
      { id: string; table_identifier: string; deleted_at: Date | null }[]
    >`
      SELECT id, table_identifier, deleted_at
      FROM qr_codes
      WHERE client_id = ${client.id}
        AND table_identifier = ANY(${normalisedIdentifiers}::text[])
    `

    // Active (non-deleted) duplicates are a hard error — they already exist.
    const activeConflicts = existingQRs.filter((qr) => qr.deleted_at === null)
    if (activeConflicts.length > 0) {
      const duplicates = activeConflicts.map((qr) => qr.table_identifier).join(', ')
      return NextResponse.json(
        { success: false, error: `QR codes already exist for: ${duplicates}` },
        { status: 400 }
      )
    }

    // Soft-deleted QR codes can be restored — same ID, same URL, no reprinting needed.
    const toRestore = existingQRs.filter((qr) => qr.deleted_at !== null)
    const toRestoreIdentifiers = new Set(toRestore.map((qr) => qr.table_identifier))
    const toCreate = normalisedIdentifiers.filter((id) => !toRestoreIdentifiers.has(id))

    // Restore soft-deleted + create brand-new ones in one transaction
    const restoredAndCreated = await prisma.$transaction(async (tx) => {
      const restored = await Promise.all(
        toRestore.map((qr) =>
          tx.qRCode.update({
            where: { id: qr.id },
            data: { deletedAt: null },
          })
        )
      )
      const created = await Promise.all(
        toCreate.map((tableIdentifier) =>
          tx.qRCode.create({
            data: { clientId: client.id, tableIdentifier },
          })
        )
      )
      return [...restored, ...created]
    })

    // Generate QR code images
    const qrCodesWithImages = await Promise.all(
      restoredAndCreated.map(async (qr) => {
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/${client.clientId}/${qr.tableIdentifier}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
        })

        return {
          ...qr,
          url,
          dataUrl,
        }
      })
    )

    return NextResponse.json({ success: true, data: qrCodesWithImages }, { status: 201 })
  } catch (error) {
    console.error('Create QR codes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE QR code
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser('client')
    if (!user || user.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'QR code ID is required' },
        { status: 400 }
      )
    }

    // Verify QR code belongs to client
    const qrCode = await prisma.qRCode.findFirst({
      where: { id, client: { id: user.id } },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR code not found' },
        { status: 404 }
      )
    }

    // Always soft-delete so the QR code ID (and therefore its URL) is
    // preserved. If the owner re-adds the same table identifier later,
    // the create route will restore this exact record — meaning the
    // same QR code image is valid and no reprinting is needed.
    await prisma.qRCode.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete QR code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
