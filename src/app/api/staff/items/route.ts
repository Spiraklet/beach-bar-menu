import { prisma } from '@/lib/db'
import { withStaffAuth, apiSuccess, apiError, apiNotFound } from '@/lib/api'

// GET all items for staff user's client
export const GET = withStaffAuth(async (_request, payload) => {
  const items = await prisma.item.findMany({
    where: { clientId: payload.clientId },
    include: {
      customizationSections: {
        include: { options: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })

  const categories = Array.from(new Set(items.map((item) => item.category)))

  // Count inactive and hidden items
  const inactiveCount = items.filter((item) => !item.active).length
  const hiddenCount = items.filter((item) => item.hidden).length

  return apiSuccess({
    items,
    categories,
    inactiveCount,
    hiddenCount,
  })
})

// PATCH toggle item active/hidden status
export const PATCH = withStaffAuth(async (request, payload) => {
  const body = await request.json()
  const { id, active, hidden, optionId, optionAvailable, optionHidden } = body

  if (!id) {
    return apiError('Item ID is required')
  }

  // Verify item belongs to the staff's client
  const item = await prisma.item.findFirst({
    where: { id, clientId: payload.clientId },
    include: {
      customizationSections: {
        include: { options: true },
      },
    },
  })

  if (!item) {
    return apiNotFound('Item')
  }

  // ─── Option-level update ───
  if (optionId) {
    // Verify option belongs to this item
    const optionBelongsToItem = item.customizationSections.some(
      (section) => section.options.some((opt) => opt.id === optionId)
    )
    if (!optionBelongsToItem) {
      return apiNotFound('Option for this item')
    }

    const optionUpdateData: { available?: boolean; hidden?: boolean } = {}
    if (typeof optionAvailable === 'boolean') optionUpdateData.available = optionAvailable
    if (typeof optionHidden === 'boolean') optionUpdateData.hidden = optionHidden

    await prisma.customizationOption.update({
      where: { id: optionId },
      data: optionUpdateData,
    })

    // Return the full updated item
    const updatedItem = await prisma.item.findUnique({
      where: { id },
      include: {
        customizationSections: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return apiSuccess(updatedItem)
  }

  // ─── Item-level update ───
  const updateData: { active?: boolean; hidden?: boolean } = {}
  if (typeof active === 'boolean') updateData.active = active
  if (typeof hidden === 'boolean') updateData.hidden = hidden

  const updatedItem = await prisma.item.update({
    where: { id },
    data: updateData,
    include: {
      customizationSections: {
        include: { options: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return apiSuccess(updatedItem)
})
