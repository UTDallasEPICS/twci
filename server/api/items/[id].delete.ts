export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const id = getRouterParam(event, 'id')

  const existing = await prisma.item.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const checkoutCount = await prisma.checkoutLog.count({
    where: { itemId: id },
  })

  if (checkoutCount > 0) {
    const openCount = await prisma.checkoutLog.count({
      where: { itemId: id, checkedInAt: null },
    })

    if (openCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Cannot delete item: it is currently checked out',
      })
    }

    throw createError({
      statusCode: 409,
      statusMessage:
        'Cannot delete item: it has checkout history. Set its condition to retired instead.',
    })
  }

  await prisma.item.delete({ where: { id } })

  return { success: true }
})
