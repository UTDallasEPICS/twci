export default defineEventHandler(async (event) => {
  const session = event.context.session
  const id = getRouterParam(event, 'id')

  // Employees can only view their own profile
  if (session.user.role === 'employee' && session.user.id !== id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      image: true,
      role: true,
      status: true,
      legalFirstName: true,
      legalLastName: true,
      preferredFirstName: true,
      preferredLastName: true,
      createdAt: true,
      updatedAt: true,
      itemsHeld: {
        orderBy: { checkedOutAt: 'desc' },
        take: 10,
        select: {
          id: true,
          checkedOutAt: true,
          checkedInAt: true,
          conditionOnReturn: true,
          item: {
            select: { id: true, name: true },
          },
          checkedOutByUser: {
            select: { id: true, name: true },
          },
          checkedOutFromLocation: {
            select: { id: true, name: true },
          },
          checkedInByUser: {
            select: { id: true, name: true },
          },
          checkedInAtLocation: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return {
    ...user,
    displayName: getDisplayName(user),
    image: user.image != null,
    checkoutHistory: user.itemsHeld.map((log) => ({
      id: log.id,
      item: log.item,
      checkedOutBy: log.checkedOutByUser,
      checkedOutFromLocation: log.checkedOutFromLocation,
      checkedOutAt: log.checkedOutAt,
      checkedInBy: log.checkedInByUser,
      checkedInAtLocation: log.checkedInAtLocation,
      checkedInAt: log.checkedInAt,
      conditionOnReturn: log.conditionOnReturn,
      isOpen: log.checkedInAt === null,
    })),
  }
})
