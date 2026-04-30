import { listUsers } from '../../../services/users'

export default defineEventHandler(async () => {
  return {
    users: await listUsers(),
  }
})
