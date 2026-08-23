export default defineEventHandler(async (event) => {
  const session = event.context.session
  const isAdminOrSupervisor = session.user.role === 'admin' || session.user.role === 'supervisor'

  const [
    totalItems,
    checkedOutCount,
    damagedCount,
    totalLocations,
    openCheckouts,
    myOpenCheckouts,
  ] = await Promise.all([
    prisma.item.count({ where: { condition: { not: 'retired' } } }),
    prisma.item.count({ where: { status: 'checked_out' } }),
    prisma.item.count({ where: { condition: 'damaged' } }),
    prisma.location.count({ where: { status: 'active' } }),
    isAdminOrSupervisor
      ? prisma.checkoutLog.findMany({
          where: { checkedInAt: null },
          orderBy: { checkedOutAt: 'asc' },
          take: 5,
          select: {
            id: true,
            checkedOutAt: true,
            item: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
            checkedOutFromLocation: { select: { id: true, name: true } },
          },
        })
      : [],
    prisma.checkoutLog.findMany({
      where: { userId: session.user.id, checkedInAt: null },
      orderBy: { checkedOutAt: 'desc' },
      select: {
        id: true,
        checkedOutAt: true,
        item: { select: { id: true, name: true } },
        checkedOutFromLocation: { select: { id: true, name: true } },
      },
    }),
  ])

  const now = Date.now()

  return {
    stats: {
      totalItems,
      checkedOut: checkedOutCount,
      damaged: damagedCount,
      locations: totalLocations,
    },
    openCheckouts: openCheckouts.map((log) => ({
      id: log.id,
      item: log.item,
      user: log.user,
      checkedOutFromLocation: log.checkedOutFromLocation,
      checkedOutAt: log.checkedOutAt,
      daysOut: Math.ceil((now - new Date(log.checkedOutAt).getTime()) / 86_400_000),
    })),
    myItems: myOpenCheckouts.map((log) => ({
      id: log.id,
      item: log.item,
      checkedOutFromLocation: log.checkedOutFromLocation,
      checkedOutAt: log.checkedOutAt,
    })),
  }
})
