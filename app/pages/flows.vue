<script setup lang="ts">
type FlowStatus = 'Active' | 'Draft'

interface FlowRow {
  id: number
  name: string
  keyword: string
  status: FlowStatus
}

const flows: FlowRow[] = [
  { id: 1, name: 'Daily Check-in', keyword: 'CHECKIN', status: 'Active' },
  { id: 2, name: 'Medication Reminder', keyword: 'MED', status: 'Active' },
  { id: 3, name: 'Emergency Alert', keyword: 'HELP', status: 'Active' },
  { id: 4, name: 'Mood Survey', keyword: 'SURVEY', status: 'Draft' },
  { id: 5, name: 'Appointment Reminder', keyword: 'APPT', status: 'Active' },
  { id: 6, name: 'Wellness Check', keyword: 'WELLNESS', status: 'Draft' },
]
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Flows</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Manage your SMS interaction flows</p>
      </div>

      <UButton
        color="success"
        icon="i-heroicons-plus-20-solid"
        label="New Flow"
      />
    </div>

    <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-white/20">
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Trigger Keyword</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="flow in flows"
            :key="flow.id"
            class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ flow.name }}</td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ flow.keyword }}</td>
            <td class="px-4 py-3">
              <UBadge
                :color="flow.status === 'Active' ? 'success' : 'neutral'"
                variant="solid"
                :label="flow.status"
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UButton
                  variant="link"
                  color="success"
                  icon="i-heroicons-pencil-square-20-solid"
                  label="Edit"
                />
                <UButton
                  variant="link"
                  color="error"
                  icon="i-heroicons-trash-20-solid"
                  label="Delete"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </UContainer>
</template>

