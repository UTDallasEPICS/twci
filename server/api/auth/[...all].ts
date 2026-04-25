import { auth, isEmailAllowed } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (event.method === 'POST' && url.pathname.endsWith('/email-otp/send-verification-otp')) {
    const body = await readBody(event)
    const email = body?.email
    if (email && !isEmailAllowed(email)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'This email is not authorized to access this application.',
      })
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
