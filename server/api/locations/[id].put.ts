import { z } from 'zod'

const updateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  address: z.string().max(500).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin')

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = updateLocationSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  const existing = await prisma.location.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  // Block deactivation if items are currently at this location
  if (parsed.data.status === 'inactive' && existing.status === 'active') {
    const itemCount = await prisma.item.count({
      where: { currentLocationId: id },
    })
    if (itemCount > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot deactivate: ${itemCount} item${itemCount === 1 ? ' is' : 's are'} currently at this location. Reassign them first.`,
      })
    }
  }

  const updated = await prisma.location.update({
    where: { id },
    data: parsed.data,
  })

  return updated
})
