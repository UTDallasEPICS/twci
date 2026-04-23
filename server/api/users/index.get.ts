export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      image: true,
    },
  })

  const redacted = users.map((user) => {
    return {
      ...user,
      image: user.image != null,
    }
  })

  return redacted
})
