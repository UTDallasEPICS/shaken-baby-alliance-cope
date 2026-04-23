import { listAuditLogs } from '../../utils/cope-fake-db'

export default defineEventHandler(() => {
  return listAuditLogs()
})

