export default defineEventHandler(async (event) => {
  const session = event.context.session
  const id = getRouterParam(event, 'id')

  // Employees can only view their own history
  if (session.user.role === 'employee' && session.user.id !== id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const logs = await prisma.checkoutLog.findMany({
    where: { userId: id },
    orderBy: { checkedOutAt: 'desc' },
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
  })

  return logs.map((log) => ({
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
  }))
})
