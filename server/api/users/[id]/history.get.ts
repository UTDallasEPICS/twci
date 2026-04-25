export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const userRole = session.user.role
  const isOwnProfile = session.user.id === id
  if (!isOwnProfile && userRole !== 'admin' && userRole !== 'supervisor') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const logs = await prisma.checkoutLog.findMany({
    where: { userId: id },
    include: {
      item: { select: { id: true, name: true } },
      checkedOutFromLocation: { select: { id: true, name: true } },
      checkedInAtLocation: { select: { id: true, name: true } },
    },
    orderBy: { checkedOutAt: 'desc' },
    take: 50,
  })

  return logs.map((log) => ({
    id: log.id,
    item: log.item,
    checkedOutAt: log.checkedOutAt,
    checkedOutFromLocation: log.checkedOutFromLocation,
    checkedInAt: log.checkedInAt,
    checkedInAtLocation: log.checkedInAtLocation,
    conditionOnReturn: log.conditionOnReturn,
  }))
})
