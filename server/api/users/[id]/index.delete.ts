export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const session = event.context.session
  const id = getRouterParam(event, 'id')

  if (session.user.id === id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete your own account',
    })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Block deletion if user has any checkout logs (FK constraint)
  const checkoutCount = await prisma.checkoutLog.count({
    where: { userId: id },
  })

  if (checkoutCount > 0) {
    const openCount = await prisma.checkoutLog.count({
      where: { userId: id, checkedInAt: null },
    })

    if (openCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot delete user: they have ${openCount} item${openCount === 1 ? '' : 's'} currently checked out`,
      })
    }

    throw createError({
      statusCode: 409,
      statusMessage:
        'Cannot delete user: they have checkout history. Set their status to inactive instead.',
    })
  }

  await prisma.user.delete({ where: { id } })

  return { success: true }
})
