import { H3Event } from "h3"
import { auth } from "./auth"

const ROLE_LEVELS: Record<string, number> = {
  user: 1,
  admin: 2,
}

export async function requireRole(event: H3Event, minRole: "user" | "admin") {
  const session = await auth.api.getSession({
    headers: event.node.req.headers as any,
  })

  if (!session?.user) {
    throw createError({ statusCode: 401, message: "Not logged in" })
  }

  const userLevel = ROLE_LEVELS[(session.user as any).role] ?? 0
  const required  = ROLE_LEVELS[minRole] ?? 999

  if (userLevel < required) {
    throw createError({ statusCode: 403, message: "Insufficient role" })
  }

  return session.user
}