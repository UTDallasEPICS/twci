import { auth, isEmailAllowed } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const isSendOtp =
    event.method === 'POST' && url.pathname.endsWith('/email-otp/send-verification-otp')
  const isSignIn = event.method === 'POST' && url.pathname.endsWith('/sign-in/email-otp')

  if (isSendOtp || isSignIn) {
    const body = await readBody(event)
    const email = body?.email?.toLowerCase()

    if (isSendOtp && email && !isEmailAllowed(email)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'This email is not authorized to access this application.',
      })
    }

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { status: true },
      })
      if (user?.status === 'inactive') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Your account has been deactivated. Contact an administrator.',
        })
      }
    }

    // Reconstruct the request with the consumed body so Better Auth can read it
    const webRequest = new Request(url, {
      method: event.method,
      headers: event.headers,
      body: JSON.stringify(body),
    })
    return auth.handler(webRequest)
  }

  return auth.handler(toWebRequest(event))
})
