import { z } from 'zod/v4'

const updateUserSchema = z.object({
  legalFirstName: z.string().min(1).optional(),
  legalLastName: z.string().min(1).optional(),
  preferredFirstName: z.string().nullable().optional(),
  preferredLastName: z.string().nullable().optional(),
  role: z.enum(['admin', 'supervisor', 'employee']).optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: result.error.issues,
    })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const data: Record<string, unknown> = { ...result.data }

  // Recompute display name if name fields changed
  const legalFirst = result.data.legalFirstName ?? existing.legalFirstName
  const legalLast = result.data.legalLastName ?? existing.legalLastName
  const prefFirst =
    result.data.preferredFirstName !== undefined
      ? result.data.preferredFirstName
      : existing.preferredFirstName
  const prefLast =
    result.data.preferredLastName !== undefined
      ? result.data.preferredLastName
      : existing.preferredLastName
  data.name = `${prefFirst || legalFirst} ${prefLast || legalLast}`

  const user = await prisma.user.update({
    where: { id },
    data,
  })

  return user
})
