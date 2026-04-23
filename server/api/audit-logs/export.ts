import { listAuditLogs } from '~~/server/utils/cope-fake-db'

export default defineEventHandler(() => {
  const logs = listAuditLogs()
  return {
    logs,
    exportedAt: new Date().toISOString(),
  }
})

