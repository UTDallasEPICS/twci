export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const locations = await prisma.location.findMany({
    include: {
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
    homeItemCount: loc._count.homeItems,
    currentItemCount: loc._count.currentItems,
  }))
})
