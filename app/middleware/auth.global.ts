import { authClient } from '../utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authRoutes = ['/login', '/auth']

  try {
    const { data: session } = await authClient.getSession()

    if (session?.user) {
      if (authRoutes.includes(to.path)) {
        return navigateTo('/dashboard')
      }
    } else {
      if (!authRoutes.includes(to.path)) {
        return navigateTo('/login')
      }
    }
  } catch {
    if (!authRoutes.includes(to.path)) {
      return navigateTo('/login')
    }
  }
})
