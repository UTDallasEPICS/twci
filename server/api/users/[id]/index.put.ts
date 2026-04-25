import { z } from 'zod'

const updateUserSchema = z.object({
  legalFirstName: z.string().min(1).max(100).optional(),
  legalLastName: z.string().min(1).max(100).optional(),
  preferredFirstName: z.string().max(100).nullable().optional(),
  preferredLastName: z.string().max(100).nullable().optional(),
  role: z.enum(['admin', 'supervisor', 'employee']).optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = updateUserSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Recompute display name if any name field changes
  const data: Record<string, unknown> = { ...parsed.data }
  const nameChanged =
    parsed.data.legalFirstName !== undefined ||
    parsed.data.legalLastName !== undefined ||
    parsed.data.preferredFirstName !== undefined ||
    parsed.data.preferredLastName !== undefined

  if (nameChanged) {
    const merged = {
      legalFirstName: parsed.data.legalFirstName ?? existing.legalFirstName,
      legalLastName: parsed.data.legalLastName ?? existing.legalLastName,
      preferredFirstName:
        parsed.data.preferredFirstName !== undefined
          ? parsed.data.preferredFirstName
          : existing.preferredFirstName,
      preferredLastName:
        parsed.data.preferredLastName !== undefined
          ? parsed.data.preferredLastName
          : existing.preferredLastName,
    }
    data.name = getDisplayName(merged)
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
  })

  return {
    id: updated.id,
    email: updated.email,
    displayName: getDisplayName(updated),
    role: updated.role,
    status: updated.status,
    legalFirstName: updated.legalFirstName,
    legalLastName: updated.legalLastName,
    preferredFirstName: updated.preferredFirstName,
    preferredLastName: updated.preferredLastName,
  }
})
