export default defineEventHandler(async (event) => {
  const session = event.context.session

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
