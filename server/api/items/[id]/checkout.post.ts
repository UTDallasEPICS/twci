import { z } from 'zod'

const checkoutSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export default defineEventHandler(async (event) => {
  requireRole(event, 'admin', 'supervisor')

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten().fieldErrors,
    })
  }

  // Validate item exists and is available
  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, currentLocationId: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  if (item.status !== 'available') {
    throw createError({ statusCode: 409, statusMessage: 'Item is not available for checkout' })
  }

  // Validate user exists and is not inactive
  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, status: true },
  })

  if (!targetUser) {
    throw createError({ statusCode: 400, statusMessage: 'User not found' })
  }

  if (targetUser.status === 'inactive') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot check out to an inactive user' })
  }

  // Atomically create checkout log and update item status
  const session = event.context.session
  const warning = targetUser.status === 'on_leave' ? 'User is currently on leave' : undefined

  const checkoutLog = await prisma.$transaction(async (tx) => {
    const log = await tx.checkoutLog.create({
      data: {
        itemId: item.id,
        userId: parsed.data.userId,
        checkedOutBy: session.user.id,
        checkedOutFromLocationId: item.currentLocationId,
      },
      select: {
        id: true,
        checkedOutAt: true,
        user: { select: { id: true, name: true } },
        checkedOutByUser: { select: { id: true, name: true } },
        checkedOutFromLocation: { select: { id: true, name: true } },
      },
    })

    await tx.item.update({
      where: { id: item.id },
      data: { status: 'checked_out' },
    })

    return log
  })

  setResponseStatus(event, 201)
  return {
    id: checkoutLog.id,
    checkedOutAt: checkoutLog.checkedOutAt,
    item: { id: item.id, name: item.name },
    user: checkoutLog.user,
    checkedOutBy: checkoutLog.checkedOutByUser,
    checkedOutFromLocation: checkoutLog.checkedOutFromLocation,
    warning,
  }
})
