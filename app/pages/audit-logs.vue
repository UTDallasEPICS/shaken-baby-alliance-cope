<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

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

const toast = useToast()

const { data: auditLogsData, refresh: refreshAudit } = await useFetch<AuditRow[]>('/api/audit-logs', {
  default: () => [],
})

const auditLogs = computed(() => auditLogsData.value ?? [])

const appSearch = useAppSearch()
const filteredAuditLogs = computed(() =>
  auditLogs.value.filter((log) =>
    rowMatchesAppSearch(
      appSearch.value,
      log.timestamp,
      log.user,
      log.action,
      log.resource,
      log.resourceId,
      log.ip,
      log.status,
    ),
  ),
)

function actionColor(action: AuditRow['action']) {
  if (action === 'CREATE') return 'success'
  if (action === 'UPDATE') return 'primary'
  if (action === 'DELETE') return 'error'
  if (action === 'SEND') return 'warning'
  return 'secondary'
}

async function exportLogs() {
  const res = await $fetch('/api/audit-logs/export')
  const logs = res?.logs ?? auditLogs.value

  // Client-side download (JSON for now).
  const payload = JSON.stringify(logs, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`
  a.click()

  URL.revokeObjectURL(url)
  toast.add({ title: 'Export started', color: 'success' })
}
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Audit Logs</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Track all system activities and changes</p>
      </div>
      <UButton
        color="neutral"
        variant="soft"
        icon="i-heroicons-arrow-down-tray-20-solid"
        label="Export Logs"
        @click="exportLogs"
      />
    </div>

    <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <UInput
          v-model="appSearch"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search user or resource..."
          :ui="copeFieldUi"
        />
        <USelect
          :items="['All Actions', 'Create', 'Update', 'Delete', 'Send', 'Login']"
          :ui="copeFieldUi"
        />
        <USelect
          :items="['All Resources', 'Flow', 'Template', 'User', 'Emergency Alert', 'Caregiver']"
          :ui="copeFieldUi"
        />
        <UInput type="date" :ui="copeFieldUi" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[1100px] text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-white/20">
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Timestamp</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">User</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Action</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Resource</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Resource ID</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">IP Address</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in filteredAuditLogs"
              :key="log.id"
              class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ log.timestamp }}</td>
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ log.user }}</td>
              <td class="px-4 py-3">
                <UBadge :label="log.action" :color="actionColor(log.action)" variant="solid" />
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ log.resource }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ log.resourceId }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ log.ip }}</td>
              <td class="px-4 py-3">
                <UBadge :label="log.status" :color="log.status === 'Success' ? 'success' : 'error'" variant="solid" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between pt-1">
        <p class="text-xs text-gray-500 dark:text-gray-300">
          {{ filteredAuditLogs.length }} log{{ filteredAuditLogs.length === 1 ? '' : 's' }} match
        </p>
        <UPagination :total="Math.max(filteredAuditLogs.length, 1)" :default-page="1" :items-per-page="8" />
      </div>
    </UCard>
  </UContainer>
</template>

