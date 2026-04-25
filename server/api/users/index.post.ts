import { z } from 'zod/v4'
import { isEmailAllowed } from '~~/server/utils/auth'

const createUserSchema = z.object({
  legalFirstName: z.string().min(1, 'Legal first name is required'),
  legalLastName: z.string().min(1, 'Legal last name is required'),
  preferredFirstName: z.string().nullable().optional(),
  preferredLastName: z.string().nullable().optional(),
  email: z.email('Invalid email address'),
  role: z.enum(['admin', 'supervisor', 'employee']),
  status: z.enum(['active', 'on_leave', 'inactive']),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const body = await readBody(event)
  const result = createUserSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: result.error.issues,
    })
  }

  if (!isEmailAllowed(result.data.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email domain not allowed',
    })
  }

  const existing = await prisma.user.findUnique({ where: { email: result.data.email } })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  const displayName = `${result.data.preferredFirstName || result.data.legalFirstName} ${result.data.preferredLastName || result.data.legalLastName}`

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email: result.data.email,
      legalFirstName: result.data.legalFirstName,
      legalLastName: result.data.legalLastName,
      preferredFirstName: result.data.preferredFirstName ?? null,
      preferredLastName: result.data.preferredLastName ?? null,
      role: result.data.role,
      status: result.data.status,
    },
  })

  setResponseStatus(event, 201)
  return user
})
