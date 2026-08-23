import type { H3Event } from 'h3'

type Role = 'admin' | 'supervisor' | 'employee'

export function requireRole(event: H3Event, ...roles: Role[]) {
  const session = event.context.session
  if (!session || !roles.includes(session.user.role as Role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}
