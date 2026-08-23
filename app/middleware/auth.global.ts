import { authClient } from '../utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  if (session.value) {
    if (to.path === '/auth') {
      const redirect = (to.query.redirect as string) || '/'
      const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
      return navigateTo(safeRedirect)
    }
  } else {
    if (to.path !== '/auth') {
      return navigateTo(`/auth?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }
})
