export default defineEventHandler(async (event) => {
  const session = event.context.session
  const id = getRouterParam(event, 'id')

  // Employees can only view their own profile
  if (session.user.role === 'employee' && session.user.id !== id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      image: true,
      role: true,
      status: true,
      legalFirstName: true,
      legalLastName: true,
      preferredFirstName: true,
      preferredLastName: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return {
    ...user,
    displayName: getDisplayName(user),
    image: user.image != null,
  }
})
