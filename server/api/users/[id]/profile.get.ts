import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing userId' })
  }

  const uploadRoot = process.env.UPLOAD_STORAGE_PATH
  if (!uploadRoot) {
    throw createError({ statusCode: 500, statusMessage: 'Upload storage path not configured' })
  }

  const record = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      image: true,
    },
  })

  if (!record?.image) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const filePath = path.resolve(uploadRoot, record.image)
  const resolvedRoot = path.resolve(uploadRoot)

  if (!filePath.startsWith(resolvedRoot + path.sep)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path' })
  }

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const fileStream = fs.createReadStream(filePath)

  setHeader(event, 'Content-Type', 'application/octet-stream')

  return sendStream(event, fileStream)
})
