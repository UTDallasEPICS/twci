export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const id = getRouterParam(event, 'id')

  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          itemsHeld: { where: { checkedInAt: null } },
        },
      },
    },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const openCheckouts = existing._count.itemsHeld
  if (openCheckouts > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot delete user: they have ${openCheckouts} items currently checked out.`,
    })
  }

  await prisma.user.delete({ where: { id } })

  setResponseStatus(event, 204)
  return null
})
