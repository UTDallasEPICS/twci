export default defineEventHandler(async (event) => {
  requireRole(event, 'admin', 'supervisor')

  const query = getQuery(event)
  const locationId = query.locationId as string | undefined
  const userId = query.userId as string | undefined

  const where: Record<string, unknown> = { checkedInAt: null }
  if (locationId) where.checkedOutFromLocationId = locationId
  if (userId) where.userId = userId

  const [logs, total] = await Promise.all([
    prisma.checkoutLog.findMany({
      where,
      orderBy: { checkedOutAt: 'asc' },
      select: {
        id: true,
        checkedOutAt: true,
        item: {
          select: { id: true, name: true, condition: true },
        },
        user: {
          select: { id: true, name: true },
        },
        checkedOutByUser: {
          select: { id: true, name: true },
        },
        checkedOutFromLocation: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.checkoutLog.count({ where }),
  ])

  const now = Date.now()

  return {
    checkouts: logs.map((log) => ({
      id: log.id,
      item: log.item,
      user: log.user,
      checkedOutBy: log.checkedOutByUser,
      checkedOutFromLocation: log.checkedOutFromLocation,
      checkedOutAt: log.checkedOutAt,
      daysOut: Math.ceil((now - new Date(log.checkedOutAt).getTime()) / 86_400_000),
    })),
    total,
  }
})
