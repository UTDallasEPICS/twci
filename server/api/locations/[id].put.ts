import { z } from 'zod/v4'

const updateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  address: z.string().max(500).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAuth(event, ['admin'])

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const result = updateLocationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: result.error.issues,
    })
  }

  const existing = await prisma.location.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  const location = await prisma.location.update({
    where: { id },
    data: result.data,
  })

  return location
})
