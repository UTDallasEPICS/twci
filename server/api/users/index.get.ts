export default defineEventHandler(async (event) => {
  requireRole(event, 'admin', 'supervisor')

  const session = event.context.session
  const query = getQuery(event)

  const role = query.role as string | undefined
  const status = query.status as string | undefined
  const search = query.search as string | undefined
  const sort = query.sort as string | undefined

  const where: Record<string, unknown> = {}

  // Role filter
  if (role && ['admin', 'supervisor', 'employee'].includes(role)) {
    where.role = role
  }

  // Status filter: supervisors always see active only
  if (session.user.role === 'admin') {
    if (status && ['active', 'on_leave', 'inactive'].includes(status)) {
      where.status = status
    }
  } else {
    where.status = { not: 'inactive' }
  }

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { legalFirstName: { contains: search } },
      { legalLastName: { contains: search } },
      { preferredFirstName: { contains: search } },
      { preferredLastName: { contains: search } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      legalFirstName: true,
      legalLastName: true,
      preferredFirstName: true,
      preferredLastName: true,
    },
    orderBy:
      sort === 'name_desc'
        ? { name: 'desc' }
        : sort === 'newest'
          ? { createdAt: 'desc' }
          : sort === 'oldest'
            ? { createdAt: 'asc' }
            : sort === 'updated'
              ? { updatedAt: 'desc' }
              : { name: 'asc' },
  })

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: getDisplayName(user),
    role: user.role,
    status: user.status,
    legalFirstName: user.legalFirstName,
    legalLastName: user.legalLastName,
    preferredFirstName: user.preferredFirstName,
    preferredLastName: user.preferredLastName,
    image: user.image != null,
  }))
})
