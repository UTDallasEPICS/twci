import path from 'node:path'
import fs from 'node:fs/promises'

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const form = await readMultipartFormData(event)

  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const file = form.find((i) => i.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'File missing' })
  }

  if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.',
    })
  }

  const uploadRoot = process.env.UPLOAD_STORAGE_PATH
  if (!uploadRoot) {
    throw createError({ statusCode: 500, statusMessage: 'Upload storage path not configured' })
  }

  const dirPath = path.join(uploadRoot, 'users', session.user.id, 'images')

  await fs.mkdir(dirPath, { recursive: true })

  const randomImageId = crypto.randomUUID()
  const filePath = path.join(dirPath, randomImageId)

  await fs.writeFile(filePath, file.data)

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      image: path.join('users', session.user.id, 'images', randomImageId),
    },
  })

  setResponseStatus(event, 201)

  return {
    message: 'Added profile picture to logged in user.',
  }
})
