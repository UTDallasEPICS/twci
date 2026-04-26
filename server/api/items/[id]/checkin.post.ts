import { z } from 'zod'

const checkinSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  condition: z.enum(['good', 'fair', 'damaged', 'retired'], {
    error: 'Condition must be good, fair, damaged, or retired',
  }),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin', 'supervisor')

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = checkinSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  // Validate item exists and is checked out
  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  if (item.status !== 'checked_out') {
    throw createError({ statusCode: 409, statusMessage: 'Item is not currently checked out' })
  }

  // Validate location exists
  const location = await prisma.location.findUnique({
    where: { id: parsed.data.locationId },
    select: { id: true, name: true },
  })

  if (!location) {
    throw createError({ statusCode: 400, statusMessage: 'Location not found' })
  }

  // Find open checkout log and complete it atomically
  const session = event.context.session

  const checkoutLog = await prisma.$transaction(async (tx) => {
    const openLog = await tx.checkoutLog.findFirst({
      where: { itemId: item.id, checkedInAt: null },
    })

    if (!openLog) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No open checkout log found for this item',
      })
    }

    const log = await tx.checkoutLog.update({
      where: { id: openLog.id },
      data: {
        checkedInBy: session.user.id,
        checkedInAtLocationId: parsed.data.locationId,
        checkedInAt: new Date(),
        conditionOnReturn: parsed.data.condition,
      },
      select: {
        id: true,
        checkedOutAt: true,
        checkedInAt: true,
        conditionOnReturn: true,
        user: { select: { id: true, name: true } },
        checkedOutByUser: { select: { id: true, name: true } },
        checkedOutFromLocation: { select: { id: true, name: true } },
        checkedInByUser: { select: { id: true, name: true } },
        checkedInAtLocation: { select: { id: true, name: true } },
      },
    })

    await tx.item.update({
      where: { id: item.id },
      data: {
        status: 'available',
        condition: parsed.data.condition,
        currentLocationId: parsed.data.locationId,
      },
    })

    return log
  })

  return {
    id: checkoutLog.id,
    item: { id: item.id, name: item.name },
    user: checkoutLog.user,
    checkedOutBy: checkoutLog.checkedOutByUser,
    checkedOutFromLocation: checkoutLog.checkedOutFromLocation,
    checkedOutAt: checkoutLog.checkedOutAt,
    checkedInBy: checkoutLog.checkedInByUser,
    checkedInAtLocation: checkoutLog.checkedInAtLocation,
    checkedInAt: checkoutLog.checkedInAt,
    conditionOnReturn: checkoutLog.conditionOnReturn,
  }
})
