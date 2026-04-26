import { z } from 'zod'

const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  condition: z.enum(['good', 'fair', 'damaged', 'retired']).optional(),
  homeLocationId: z.string().uuid('Invalid location').optional(),
  currentLocationId: z.string().uuid('Invalid location').optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = updateItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  const existing = await prisma.item.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  if (parsed.data.homeLocationId) {
    const location = await prisma.location.findUnique({
      where: { id: parsed.data.homeLocationId },
    })
    if (!location) {
      throw createError({ statusCode: 400, statusMessage: 'Home location not found' })
    }
  }

  if (parsed.data.currentLocationId) {
    const location = await prisma.location.findUnique({
      where: { id: parsed.data.currentLocationId },
    })
    if (!location) {
      throw createError({ statusCode: 400, statusMessage: 'Current location not found' })
    }
  }

  const updated = await prisma.item.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      description: true,
      condition: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      homeLocation: {
        select: { id: true, name: true },
      },
      currentLocation: {
        select: { id: true, name: true },
      },
    },
  })

  return updated
})
