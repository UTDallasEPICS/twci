export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const logs = await prisma.checkoutLog.findMany({
    where: { itemId: id },
    orderBy: { checkedOutAt: 'desc' },
    select: {
      id: true,
      checkedOutAt: true,
      checkedInAt: true,
      conditionOnReturn: true,
      user: {
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
    user: log.user,
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
