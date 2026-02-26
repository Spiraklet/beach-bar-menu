import { prisma } from './db'
import type { AuditAction, AuditEntityType, Prisma } from '@prisma/client'

// ============================================================================
// AUDIT LOGGING UTILITY
// ============================================================================

export interface AuditLogParams {
  clientId?: string | null // null for admin actions
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail?: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        clientId: params.clientId ?? null,
        actorType: params.actorType,
        actorId: params.actorId,
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: params.details as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Log a successful login
 */
export async function logLogin(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail: string
  clientId?: string
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clientId: params.clientId ?? null,
    actorType: params.actorType,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'LOGIN',
    entityType: params.actorType === 'ADMIN' ? 'ADMIN' : params.actorType === 'CLIENT' ? 'CLIENT' : 'STAFF_SETTINGS',
    entityId: params.actorId,
    ipAddress: params.ipAddress,
  })
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailed(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorEmail: string
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    actorType: params.actorType,
    actorId: 'unknown', // No valid actor ID for failed login
    actorEmail: params.actorEmail,
    action: 'LOGIN_FAILED',
    entityType: params.actorType === 'ADMIN' ? 'ADMIN' : params.actorType === 'CLIENT' ? 'CLIENT' : 'STAFF_SETTINGS',
    ipAddress: params.ipAddress,
  })
}

/**
 * Log a logout
 */
export async function logLogout(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail?: string
  clientId?: string
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clientId: params.clientId ?? null,
    actorType: params.actorType,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'LOGOUT',
    entityType: params.actorType === 'ADMIN' ? 'ADMIN' : params.actorType === 'CLIENT' ? 'CLIENT' : 'STAFF_SETTINGS',
    entityId: params.actorId,
    ipAddress: params.ipAddress,
  })
}

/**
 * Log entity creation
 */
export async function logCreate(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail?: string
  clientId?: string
  entityType: AuditEntityType
  entityId: string
  details?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clientId: params.clientId ?? null,
    actorType: params.actorType,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'CREATE',
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    ipAddress: params.ipAddress,
  })
}

/**
 * Log entity update
 */
export async function logUpdate(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail?: string
  clientId?: string
  entityType: AuditEntityType
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clientId: params.clientId ?? null,
    actorType: params.actorType,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'UPDATE',
    entityType: params.entityType,
    entityId: params.entityId,
    details: {
      old: params.oldValues ?? {},
      new: params.newValues ?? {},
    },
    ipAddress: params.ipAddress,
  })
}

/**
 * Log entity deletion (soft delete)
 */
export async function logDelete(params: {
  actorType: 'ADMIN' | 'CLIENT' | 'STAFF'
  actorId: string
  actorEmail?: string
  clientId?: string
  entityType: AuditEntityType
  entityId: string
  details?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clientId: params.clientId ?? null,
    actorType: params.actorType,
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: 'DELETE',
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    ipAddress: params.ipAddress,
  })
}

/**
 * Get audit logs for a client (for admin view)
 */
export async function getAuditLogs(params: {
  clientId?: string
  limit?: number
  offset?: number
  entityType?: AuditEntityType
  action?: AuditAction
}) {
  return prisma.auditLog.findMany({
    where: {
      ...(params.clientId ? { clientId: params.clientId } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.action ? { action: params.action } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: params.limit ?? 100,
    skip: params.offset ?? 0,
  })
}

/**
 * Get recent audit logs for admin dashboard
 */
export async function getRecentAuditLogs(limit: number = 50) {
  return prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * Extract IP address from request headers
 */
export function getIpFromRequest(headers: Headers): string | null {
  // Check X-Forwarded-For (set by proxies/load balancers)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list, take the first IP
    return forwarded.split(',')[0].trim()
  }

  // Check X-Real-IP (Nginx)
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return null
}
