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
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">Flows</h1>
        <p class="mt-2 text-base text-[#64748b]">Manage your SMS interaction flows</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus-20-solid" label="New Flow" />
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#f8fbff]">
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Name</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Trigger Keyword</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="flow in flows"
            :key="flow.id"
            class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
          >
            <td class="px-6 py-4 font-medium text-[#102a43]">{{ flow.name }}</td>
            <td class="px-6 py-4 text-[#64748b]">{{ flow.keyword }}</td>
            <td class="px-6 py-4">
              <UBadge :color="flow.status === 'Active' ? 'success' : 'neutral'" variant="solid" :label="flow.status" />
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <UButton variant="ghost" color="neutral" icon="i-heroicons-pencil-square-20-solid" size="xs" label="Edit" />
                <UButton variant="ghost" color="error" icon="i-heroicons-trash-20-solid" size="xs" label="Delete" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
