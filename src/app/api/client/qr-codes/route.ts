import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { validateTableIdentifier } from '@/lib/auth'
import { withAuth, apiError, apiNotFound, apiSuccess } from '@/lib/api'
import QRCode from 'qrcode'

// GET all QR codes for client
export const GET = withAuth('client', async (_request, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
  }

  const qrCodes = await prisma.qRCode.findMany({
    where: { clientId: client.id },
    orderBy: { tableIdentifier: 'asc' },
  })

  // Generate QR code data URLs
  const qrCodesWithImages = await Promise.all(
    qrCodes.map(async (qr) => {
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/${client.clientId}/${qr.tableIdentifier}?t=${qr.token}`
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

  return apiSuccess(qrCodesWithImages)
})

// POST create new QR code(s)
export const POST = withAuth('client', async (request: NextRequest, user) => {
  const client = await prisma.client.findUnique({
    where: { id: user.id },
  })

  if (!client) {
    return apiNotFound('Client')
  }

  const body = await request.json()
  const { tableIdentifiers } = body as { tableIdentifiers: string[] }

  if (!tableIdentifiers || tableIdentifiers.length === 0) {
    return apiError('Table identifiers are required')
  }

  // Normalise all identifiers to uppercase so that A1 and a1 are treated
  // as the same table, preventing case-sensitivity inconsistencies.
  const normalisedIdentifiers = tableIdentifiers.map((id) => id.trim().toUpperCase())

  // Validate each identifier format
  const invalidIdentifiers = normalisedIdentifiers.filter((id) => !validateTableIdentifier(id))
  if (invalidIdentifiers.length > 0) {
    return apiError(`Invalid table identifiers: ${invalidIdentifiers.join(', ')}. Use only letters and numbers (max 10 characters).`)
  }

  // Check for duplicates within the submitted batch itself
  const uniqueInBatch = new Set(normalisedIdentifiers)
  if (uniqueInBatch.size !== normalisedIdentifiers.length) {
    return apiError('Duplicate table identifiers in request')
  }

  // Look up ALL existing QR codes for these identifiers, including
  // soft-deleted ones. We need the full picture to decide what to do.
  const existingQRs = await prisma.$queryRaw<
    { id: string; table_identifier: string; deleted_at: Date | null; token: string | null }[]
  >`
    SELECT id, table_identifier, deleted_at, token
    FROM qr_codes
    WHERE client_id = ${client.id}
      AND table_identifier = ANY(${normalisedIdentifiers}::text[])
  `

  // Active (non-deleted) duplicates are a hard error — they already exist.
  const activeConflicts = existingQRs.filter((qr) => qr.deleted_at === null)
  if (activeConflicts.length > 0) {
    const duplicates = activeConflicts.map((qr) => qr.table_identifier).join(', ')
    return apiError(`QR codes already exist for: ${duplicates}`)
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
          data: {
            deletedAt: null,
            // Backfill token if missing (pre-migration records)
            ...(qr.token ? {} : { token: randomBytes(16).toString('hex') }),
          },
        })
      )
    )
    const created = await Promise.all(
      toCreate.map((tableIdentifier) =>
        tx.qRCode.create({
          data: {
            clientId: client.id,
            tableIdentifier,
            token: randomBytes(16).toString('hex'),
          },
        })
      )
    )
    return [...restored, ...created]
  })

  // Generate QR code images
  const qrCodesWithImages = await Promise.all(
    restoredAndCreated.map(async (qr) => {
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/${client.clientId}/${qr.tableIdentifier}?t=${qr.token}`
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

  return apiSuccess(qrCodesWithImages, 201)
})

// DELETE QR code
export const DELETE = withAuth('client', async (request: NextRequest, user) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return apiError('QR code ID is required')
  }

  // Verify QR code belongs to client
  const qrCode = await prisma.qRCode.findFirst({
    where: { id, client: { id: user.id } },
  })

  if (!qrCode) {
    return apiNotFound('QR code')
  }

  // Always soft-delete so the QR code ID (and therefore its URL) is
  // preserved. If the owner re-adds the same table identifier later,
  // the create route will restore this exact record — meaning the
  // same QR code image is valid and no reprinting is needed.
  await prisma.qRCode.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return apiSuccess()
})
