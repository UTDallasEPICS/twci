export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Skip auth routes — Better Auth handles these
  if (path.startsWith('/api/auth/')) return

  // Only protect /api/* routes
  if (!path.startsWith('/api/')) return

  const session = await auth.api.getSession({ headers: event.headers })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  event.context.session = session
})
