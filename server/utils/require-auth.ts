import type { H3Event } from 'h3'
import { auth } from './auth'

type Role = 'admin' | 'supervisor' | 'employee'

interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: string
    status: string
    [key: string]: unknown
  }
  session: {
    id: string
    [key: string]: unknown
  }
}

export async function requireAuth(event: H3Event, roles?: Role[]): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (roles && roles.length > 0) {
    const userRole = (session.user as Record<string, unknown>).role as string
    if (!roles.includes(userRole as Role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  return session as unknown as AuthSession
}
