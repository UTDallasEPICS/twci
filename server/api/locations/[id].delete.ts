export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const id = getRouterParam(event, 'id')

  const existing = await prisma.location.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          homeItems: true,
          currentItems: true,
        },
      },
    },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  const totalItems = existing._count.homeItems + existing._count.currentItems
  if (totalItems > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot delete location: ${totalItems} items are still assigned to it.`,
    })
  }

  await prisma.location.delete({ where: { id } })

  setResponseStatus(event, 204)
  return null
})
