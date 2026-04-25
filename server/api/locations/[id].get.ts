export default defineEventHandler(async (event) => {
  const session = event.context.session
  const id = getRouterParam(event, 'id')

  const location = await prisma.location.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      status: true,
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

  // Non-admins cannot view inactive locations
  if (location.status === 'inactive' && session.user.role !== 'admin') {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  return {
    id: location.id,
    name: location.name,
    address: location.address,
    status: location.status,
    homeItemCount: location._count.homeItems,
    currentItemCount: location._count.currentItems,
    currentItems: location.currentItems,
  }
})
