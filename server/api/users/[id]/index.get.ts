export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  const userRole = session.user.role
  const isOwnProfile = session.user.id === id
  if (!isOwnProfile && userRole !== 'admin' && userRole !== 'supervisor') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
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
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          itemsHeld: { where: { checkedInAt: null } },
        },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const pastCheckouts = await prisma.checkoutLog.count({
    where: { userId: id, checkedInAt: { not: null } },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    legalFirstName: user.legalFirstName,
    legalLastName: user.legalLastName,
    preferredFirstName: user.preferredFirstName,
    preferredLastName: user.preferredLastName,
    displayName: getDisplayName(user),
    role: user.role,
    status: user.status,
    image: user.image != null,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    currentItemsHeld: user._count.itemsHeld,
    pastCheckoutCount: pastCheckouts,
  }
})
