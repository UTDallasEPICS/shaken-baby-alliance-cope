import { createAuthClient } from "better-auth/vue"
import { usernameClient } from "better-auth/client/plugins"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [usernameClient(), emailOTPClient()],
})