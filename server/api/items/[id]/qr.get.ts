export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const query = getQuery(event)
  const size = Math.min(1000, Math.max(100, Number(query.size) || 400))

  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found' })
  }

  const buffer = await generateQRCode(item.id, env.BETTER_AUTH_URL, size)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

  return buffer
})
