export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
