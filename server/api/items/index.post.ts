import { randomUUID } from 'crypto'
import { z } from 'zod'

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  condition: z.enum(['good', 'fair', 'damaged', 'retired']).default('good'),
  locationId: z.string().uuid('Invalid location'),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const body = await readBody(event)
  const parsed = createItemSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  const location = await prisma.location.findUnique({
    where: { id: parsed.data.locationId },
  })

  if (!location) {
    throw createError({ statusCode: 400, statusMessage: 'Location not found' })
  }

  if (location.status === 'inactive') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot assign item to an inactive location',
    })
  }

  const itemId = randomUUID()

  const item = await prisma.item.create({
    data: {
      id: itemId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      condition: parsed.data.condition,
      status: 'available',
      homeLocationId: parsed.data.locationId,
      currentLocationId: parsed.data.locationId,
      qrCodeUrl: `/api/items/${itemId}/qr`,
    },
    select: {
      id: true,
      name: true,
      description: true,
      condition: true,
      status: true,
      qrCodeUrl: true,
      createdAt: true,
      homeLocation: {
        select: { id: true, name: true },
      },
      currentLocation: {
        select: { id: true, name: true },
      },
    },
  })

  setResponseStatus(event, 201)
  return item
})
