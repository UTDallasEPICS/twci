import { z } from 'zod/v4'

const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const body = await readBody(event)
  const result = createLocationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: result.error.issues,
    })
  }

  const location = await prisma.location.create({
    data: {
      name: result.data.name,
      address: result.data.address,
    },
  })

  setResponseStatus(event, 201)
  return location
})
