export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          homeItems: true,
          currentItems: true,
        },
      },
      currentItems: {
        select: {
          id: true,
          name: true,
          condition: true,
          status: true,
        },
      },
    },
  })

  if (!location) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  return {
    id: location.id,
    name: location.name,
    address: location.address,
    homeItemCount: location._count.homeItems,
    currentItemCount: location._count.currentItems,
    currentItems: location.currentItems,
  }
})
