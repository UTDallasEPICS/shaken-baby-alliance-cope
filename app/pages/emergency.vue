<script setup lang="ts">
type AlertStatus = 'Active' | 'Resolved' | 'Dismissed'

interface EmergencyAlert {
  id: number
  status: AlertStatus
  patient: string
  patientId: string
  type: string
  time: string
  respondedBy: string
}

const alerts: EmergencyAlert[] = [
  {
    id: 1,
    status: 'Active',
    patient: 'Robert Miller',
    patientId: '#1014',
    type: 'Fall Detected',
    time: '2024-03-06 10:45 AM',
    respondedBy: '---',
  },
  {
    id: 2,
    status: 'Active',
    patient: 'Margaret Johnson',
    patientId: '#1016',
    type: 'Medication Emergency',
    time: '2024-03-06 09:12 AM',
    respondedBy: '---',
  },
  {
    id: 3,
    status: 'Resolved',
    patient: 'James Wilson',
    patientId: '#1017',
    type: 'Distress Signal',
    time: '2024-03-05 08:32 AM',
    respondedBy: 'Dr. Sarah Chen',
  },
  {
    id: 4,
    status: 'Resolved',
    patient: 'Patricia Brown',
    patientId: '#1039',
    type: 'No Response',
    time: '2024-03-05 11:20 PM',
    respondedBy: 'Nurse Linda Martinez',
  },
  {
    id: 5,
    status: 'Dismissed',
    patient: 'Thomas Anderson',
    patientId: '#1007',
    type: 'Chest Pain',
    time: '2024-03-04 06:46 PM',
    respondedBy: 'Dr. Michael Torres',
  },
]

const activeCount = computed(() => alerts.filter((a) => a.status === 'Active').length)
const resolvedCount = computed(() => alerts.filter((a) => a.status === 'Resolved').length)
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Emergency Alerts</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Monitor and respond to emergency situations</p>
      </div>

      <div class="flex items-center gap-2">
        <div class="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-center dark:border-red-500/40 dark:bg-red-950/40">
          <p class="text-lg font-bold leading-none text-red-600 dark:text-red-400">{{ activeCount }}</p>
          <p class="text-xs font-medium text-red-600 dark:text-red-400">Active</p>
        </div>
        <div class="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-center dark:border-green-500/40 dark:bg-green-950/40">
          <p class="text-lg font-bold leading-none text-green-600 dark:text-green-400">{{ resolvedCount }}</p>
          <p class="text-xs font-medium text-green-600 dark:text-green-400">Resolved</p>
        </div>
      </div>
    </div>

    <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-white/20">
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Patient</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Alert Type</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Time</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Responded By</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="alert in alerts"
              :key="alert.id"
              :class="[
                'border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5',
                alert.status === 'Active' ? 'bg-red-50/50 dark:bg-red-950/25' : '',
              ]"
            >
              <td class="px-4 py-3">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                    alert.status === 'Active' && 'bg-red-100 text-red-700',
                    alert.status === 'Resolved' && 'bg-green-100 text-green-700',
                    alert.status === 'Dismissed' && 'bg-gray-100 text-gray-700',
                  ]"
                >
                  <UIcon
                    :name="
                      alert.status === 'Active'
                        ? 'i-heroicons-exclamation-circle-20-solid'
                        : alert.status === 'Resolved'
                          ? 'i-heroicons-check-circle-20-solid'
                          : 'i-heroicons-minus-circle-20-solid'
                    "
                    class="h-3.5 w-3.5"
                  />
                  {{ alert.status }}
                </span>
              </td>

              <td class="px-4 py-3">
                <p class="font-medium text-gray-900 dark:text-white">{{ alert.patient }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ alert.patientId }}</p>
              </td>

              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ alert.type }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ alert.time }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ alert.respondedBy }}</td>
              <td class="px-4 py-3">
                <template v-if="alert.status === 'Active'">
                  <div class="flex items-center gap-3">
                    <UButton size="xs" color="primary" label="Respond" />
                    <UButton size="xs" variant="link" color="primary" label="Dismiss" />
                  </div>
                </template>
                <template v-else>
                  <UButton variant="link" color="primary" label="View Details" />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>

