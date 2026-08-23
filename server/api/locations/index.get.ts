export default defineEventHandler(async (event) => {
  const session = event.context.session
  const query = getQuery(event)

  // Non-admins always see active only
  let statusFilter: string | undefined = 'active'
  if (session.user.role === 'admin') {
    const requested = query.status as string | undefined
    if (requested === 'inactive') statusFilter = 'inactive'
    else if (requested === 'all') statusFilter = undefined
    // default: 'active'
  }

  const locations = await prisma.location.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
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
    },
    orderBy: { name: 'asc' },
  })

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    status: loc.status,
    homeItemCount: loc._count.homeItems,
    currentItemCount: loc._count.currentItems,
  }))
})
