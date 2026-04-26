export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const locationId = query.locationId as string | undefined
  const homeLocationId = query.homeLocationId as string | undefined
  const status = query.status as string | undefined
  const condition = query.condition as string | undefined
  const search = query.search as string | undefined

  const where: Record<string, unknown> = {}

  if (locationId) {
    where.currentLocationId = locationId
  }

  if (homeLocationId) {
    where.homeLocationId = homeLocationId
  }

  if (status && ['available', 'checked_out'].includes(status)) {
    where.status = status
  }

  if (condition && ['good', 'fair', 'damaged', 'retired'].includes(condition)) {
    where.condition = condition
  }

  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }]
  }

  const items = await prisma.item.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      condition: true,
      status: true,
      createdAt: true,
      homeLocation: {
        select: { id: true, name: true },
      },
      currentLocation: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    condition: item.condition,
    status: item.status,
    createdAt: item.createdAt,
    homeLocation: item.homeLocation,
    currentLocation: item.currentLocation,
  }))
})
