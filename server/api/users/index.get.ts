export default defineEventHandler(async (event) => {
  const session = await requireAuth(event, ['admin', 'supervisor'])

  const query = getQuery(event)
  const role = query.role as string | undefined
  const status = query.status as string | undefined
  const search = query.search as string | undefined

  const where: Record<string, unknown> = {}

  if (role) {
    where.role = role
  }
  if (status) {
    where.status = status
  }
  if (search) {
    where.OR = [
      { legalFirstName: { contains: search } },
      { legalLastName: { contains: search } },
      { preferredFirstName: { contains: search } },
      { preferredLastName: { contains: search } },
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      legalFirstName: true,
      legalLastName: true,
      preferredFirstName: true,
      preferredLastName: true,
      role: true,
      status: true,
      image: true,
    },
    orderBy: { name: 'asc' },
  })

  return users.map((user) => ({
    id: user.id,
    legalFirstName: user.legalFirstName,
    legalLastName: user.legalLastName,
    preferredFirstName: user.preferredFirstName,
    preferredLastName: user.preferredLastName,
    displayName: getDisplayName(user),
    email: user.email,
    role: user.role,
    status: user.status,
    image: user.image != null,
  }))
})
