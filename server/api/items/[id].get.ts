export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const item = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      condition: true,
      status: true,
      qrCodeUrl: true,
      createdAt: true,
      updatedAt: true,
      homeLocation: {
        select: { id: true, name: true },
      },
      currentLocation: {
        select: { id: true, name: true },
      },
      checkoutLogs: {
        orderBy: { checkedOutAt: 'desc' },
        take: 10,
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
      },
    },
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const openLog = item.checkoutLogs.find((log) => log.checkedInAt === null)

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    condition: item.condition,
    status: item.status,
    qrCodeUrl: item.qrCodeUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    homeLocation: item.homeLocation,
    currentLocation: item.currentLocation,
    currentCheckout: openLog
      ? {
          id: openLog.id,
          user: openLog.user,
          checkedOutBy: openLog.checkedOutByUser,
          checkedOutFromLocation: openLog.checkedOutFromLocation,
          checkedOutAt: openLog.checkedOutAt,
        }
      : null,
    recentHistory: item.checkoutLogs.map((log) => ({
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
    })),
  }
})
