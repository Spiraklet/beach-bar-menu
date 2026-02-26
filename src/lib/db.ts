import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create base client
const prismaBase =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// ============================================================================
// SOFT DELETE MIDDLEWARE
// ============================================================================
// Tables with soft delete: Client, Item, QRCode
const softDeleteModels = ['Client', 'Item', 'QRCode']

// Middleware to filter out soft-deleted records on read operations
prismaBase.$use(async (params: Prisma.MiddlewareParams, next) => {
  // Only apply to models with soft delete
  if (!params.model || !softDeleteModels.includes(params.model)) {
    return next(params)
  }

  // Handle find operations - filter out deleted records
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    // Change to findFirst to allow adding where clause
    params.action = 'findFirst'
    params.args = params.args || {}
    if (params.args.where) {
      // findFirst does not support compound unique keys (e.g. clientId_itemId,
      // clientId_tableIdentifier). Expand any compound key found in the where
      // clause into its individual field equivalents before spreading.
      const where = { ...params.args.where }

      if (where.clientId_itemId) {
        const { clientId, itemId } = where.clientId_itemId as { clientId: string; itemId: string }
        delete where.clientId_itemId
        where.clientId = clientId
        where.itemId = itemId
      }

      if (where.clientId_tableIdentifier) {
        const { clientId, tableIdentifier } = where.clientId_tableIdentifier as { clientId: string; tableIdentifier: string }
        delete where.clientId_tableIdentifier
        where.clientId = clientId
        where.tableIdentifier = tableIdentifier
      }

      params.args.where = { ...where, deletedAt: null }
    } else {
      params.args.where = { deletedAt: null }
    }
  }

  if (params.action === 'findMany') {
    params.args = params.args || {}
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null
      }
    } else {
      params.args.where = { deletedAt: null }
    }
  }

  // Handle count operations
  if (params.action === 'count') {
    params.args = params.args || {}
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null
      }
    } else {
      params.args.where = { deletedAt: null }
    }
  }

  // Handle delete operations - convert to soft delete (update deletedAt)
  if (params.action === 'delete') {
    params.action = 'update'
    params.args = params.args || {}
    params.args.data = { deletedAt: new Date() }
  }

  if (params.action === 'deleteMany') {
    params.action = 'updateMany'
    params.args = params.args || {}
    if (params.args.data !== undefined) {
      params.args.data.deletedAt = new Date()
    } else {
      params.args.data = { deletedAt: new Date() }
    }
  }

  return next(params)
})

export const prisma = prismaBase

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ============================================================================
// UTILITY: Hard delete (for permanent deletion, e.g., GDPR)
// ============================================================================
export async function hardDeleteClient(clientId: string) {
  // Use raw query to bypass soft delete middleware
  await prismaBase.$executeRaw`DELETE FROM clients WHERE id = ${clientId}`
}

export async function hardDeleteItem(itemId: string) {
  await prismaBase.$executeRaw`DELETE FROM items WHERE id = ${itemId}`
}

export async function hardDeleteQRCode(qrCodeId: string) {
  await prismaBase.$executeRaw`DELETE FROM qr_codes WHERE id = ${qrCodeId}`
}
