import { z } from 'zod'

const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const body = await readBody(event)
  const parsed = createLocationSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  const location = await prisma.location.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address ?? null,
    },
  })

  setResponseStatus(event, 201)
  return location
})
