import { createAuthClient } from "better-auth/vue"
import { usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [usernameClient()],
  baseURL: "http://localhost:3000"
})