import { z } from 'zod'

const createUserSchema = z.object({
  legalFirstName: z.string().min(1, 'Legal first name is required').max(100),
  legalLastName: z.string().min(1, 'Legal last name is required').max(100),
  preferredFirstName: z.string().max(100).nullable().optional(),
  preferredLastName: z.string().max(100).nullable().optional(),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'supervisor', 'employee']).default('employee'),
  status: z.enum(['active', 'on_leave', 'inactive']).default('active'),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const body = await readBody(event)
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  if (!isEmailAllowed(parsed.data.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email domain not allowed',
    })
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  const displayName = getDisplayName(parsed.data)

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email: parsed.data.email,
      emailVerified: false,
      legalFirstName: parsed.data.legalFirstName,
      legalLastName: parsed.data.legalLastName,
      preferredFirstName: parsed.data.preferredFirstName ?? null,
      preferredLastName: parsed.data.preferredLastName ?? null,
      role: parsed.data.role,
      status: parsed.data.status,
    },
  })

  setResponseStatus(event, 201)
  return {
    id: user.id,
    email: user.email,
    displayName,
    role: user.role,
    status: user.status,
    legalFirstName: user.legalFirstName,
    legalLastName: user.legalLastName,
    preferredFirstName: user.preferredFirstName,
    preferredLastName: user.preferredLastName,
  }
})
