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
  { id: 1, status: 'Active', patient: 'Robert Miller', patientId: '#1014', type: 'Fall Detected', time: '2024-03-06 10:45 AM', respondedBy: '---' },
  { id: 2, status: 'Active', patient: 'Margaret Johnson', patientId: '#1016', type: 'Medication Emergency', time: '2024-03-06 09:12 AM', respondedBy: '---' },
  { id: 3, status: 'Resolved', patient: 'James Wilson', patientId: '#1017', type: 'Distress Signal', time: '2024-03-05 08:32 AM', respondedBy: 'Dr. Sarah Chen' },
  { id: 4, status: 'Resolved', patient: 'Patricia Brown', patientId: '#1039', type: 'No Response', time: '2024-03-05 11:20 PM', respondedBy: 'Nurse Linda Martinez' },
  { id: 5, status: 'Dismissed', patient: 'Thomas Anderson', patientId: '#1007', type: 'Chest Pain', time: '2024-03-04 06:46 PM', respondedBy: 'Dr. Michael Torres' },
]

const activeCount = computed(() => alerts.filter((a) => a.status === 'Active').length)
const resolvedCount = computed(() => alerts.filter((a) => a.status === 'Resolved').length)
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">Emergency Alerts</h1>
        <p class="mt-2 text-base text-[#64748b]">Monitor and respond to emergency situations</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center">
          <p class="text-xl font-bold leading-none text-red-600">{{ activeCount }}</p>
          <p class="text-xs font-medium text-red-500 mt-1">Active</p>
        </div>
        <div class="rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-center">
          <p class="text-xl font-bold leading-none text-green-600">{{ resolvedCount }}</p>
          <p class="text-xs font-medium text-green-500 mt-1">Resolved</p>
        </div>
      </div>
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Patient</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Alert Type</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Time</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Responded By</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="alert in alerts"
              :key="alert.id"
              :class="[
                'border-t border-[#f1f5f9] transition duration-150',
                alert.status === 'Active' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-[#f8fbff]',
              ]"
            >
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                    alert.status === 'Active' && 'bg-red-100 text-red-700',
                    alert.status === 'Resolved' && 'bg-green-100 text-green-700',
                    alert.status === 'Dismissed' && 'bg-gray-100 text-gray-600',
                  ]"
                >
                  <UIcon
                    :name="alert.status === 'Active' ? 'i-heroicons-exclamation-circle-20-solid' : alert.status === 'Resolved' ? 'i-heroicons-check-circle-20-solid' : 'i-heroicons-minus-circle-20-solid'"
                    class="h-3.5 w-3.5"
                  />
                  {{ alert.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-[#102a43]">{{ alert.patient }}</p>
                <p class="text-xs text-[#64748b]">{{ alert.patientId }}</p>
              </td>
              <td class="px-6 py-4 text-[#475569]">{{ alert.type }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ alert.time }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ alert.respondedBy }}</td>
              <td class="px-6 py-4">
                <template v-if="alert.status === 'Active'">
                  <div class="flex items-center gap-2">
                    <UButton size="xs" color="primary" label="Respond" />
                    <UButton size="xs" variant="ghost" color="neutral" label="Dismiss" />
                  </div>
                </template>
                <template v-else>
                  <UButton variant="ghost" color="neutral" size="xs" label="View Details" />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
