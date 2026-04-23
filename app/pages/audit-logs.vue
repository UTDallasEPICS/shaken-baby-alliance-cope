<script setup lang="ts">
interface AuditRow {
  id: number
  timestamp: string
  user: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SEND' | 'LOGIN'
  resource: string
  resourceId: string
  ip: string
  status: 'Success' | 'Failed'
}

const auditLogs: AuditRow[] = [
  { id: 1, timestamp: '2024-03-06 18:45:32', user: 'sarah.johnson@cope.com', action: 'CREATE', resource: 'Flow', resourceId: 'flow-2847', ip: '192.168.1.45', status: 'Success' },
  { id: 2, timestamp: '2024-03-06 18:32:18', user: 'michael.chen@cope.com', action: 'UPDATE', resource: 'Template', resourceId: 'template-156', ip: '107.168.1.89', status: 'Success' },
  { id: 3, timestamp: '2024-03-06 16:15:09', user: 'emily.davis@cope.com', action: 'DELETE', resource: 'Flow', resourceId: 'flow-2895', ip: '192.168.1.122', status: 'Success' },
  { id: 4, timestamp: '2024-03-06 11:44:44', user: 'david.martinez@cope.com', action: 'UPDATE', resource: 'User', resourceId: 'user-149', ip: '107.168.1.89', status: 'Failed' },
  { id: 5, timestamp: '2024-03-06 09:42:21', user: 'system@cope.com', action: 'SEND', resource: 'Emergency Alert', resourceId: 'alert-786', ip: '127.0.0.1', status: 'Success' },
  { id: 6, timestamp: '2024-03-06 09:33:55', user: 'sarah.johnson@cope.com', action: 'CREATE', resource: 'Caregiver', resourceId: 'caregiver-234', ip: '192.168.1.45', status: 'Success' },
  { id: 7, timestamp: '2024-03-06 08:18:37', user: 'michael.chen@cope.com', action: 'UPDATE', resource: 'Flow', resourceId: 'flow-2842', ip: '107.168.1.89', status: 'Success' },
  { id: 8, timestamp: '2024-03-06 08:05:12', user: 'emily.davis@cope.com', action: 'LOGIN', resource: 'System', resourceId: 'session-408', ip: '192.168.1.122', status: 'Success' },
]

function actionColor(action: AuditRow['action']) {
  if (action === 'CREATE') return 'success'
  if (action === 'UPDATE') return 'primary'
  if (action === 'DELETE') return 'error'
  if (action === 'SEND') return 'warning'
  return 'secondary'
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">Audit Logs</h1>
        <p class="mt-2 text-base text-[#64748b]">Track all system activities and changes</p>
      </div>
      <UButton color="neutral" variant="soft" icon="i-heroicons-arrow-down-tray-20-solid" label="Export Logs" />
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden p-6 space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="flex h-11 items-center gap-3 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:16px;height:16px;color:#94a3b8;" />
          <input placeholder="Search user or resource..." class="w-full bg-transparent text-sm outline-none text-[#102a43]" />
        </div>
        <USelect :items="['All Actions', 'Create', 'Update', 'Delete', 'Send', 'Login']" />
        <USelect :items="['All Resources', 'Flow', 'Template', 'User', 'Emergency Alert', 'Caregiver']" />
        <UInput type="date" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1100px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Timestamp</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">User</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Action</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Resource</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Resource ID</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">IP Address</th>
              <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in auditLogs"
              :key="log.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-5 py-4 text-[#64748b]">{{ log.timestamp }}</td>
              <td class="px-5 py-4 font-medium text-[#102a43]">{{ log.user }}</td>
              <td class="px-5 py-4">
                <UBadge :label="log.action" :color="actionColor(log.action)" variant="solid" />
              </td>
              <td class="px-5 py-4 text-[#475569]">{{ log.resource }}</td>
              <td class="px-5 py-4 text-[#64748b]">{{ log.resourceId }}</td>
              <td class="px-5 py-4 text-[#64748b]">{{ log.ip }}</td>
              <td class="px-5 py-4">
                <UBadge :label="log.status" :color="log.status === 'Success' ? 'success' : 'error'" variant="solid" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between pt-1">
        <p class="text-xs text-[#64748b]">Showing 1–8 of 248 logs</p>
        <UPagination :total="248" :default-page="1" :items-per-page="8" />
      </div>
    </div>
  </div>
</template>
