import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters'),
  BETTER_AUTH_URL: z.string().url(),
  EMAIL_USER: z.string().min(1),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  EMAIL_HOST: z.string().min(1),
  UPLOAD_STORAGE_PATH: z.string().min(1),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Missing or invalid environment variables. Check server logs.')
}

export const env = parsed.data
