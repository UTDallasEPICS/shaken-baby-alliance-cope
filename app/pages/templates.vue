<script setup lang="ts">
interface TemplateRow {
  id: number
  name: string
  category: string
  preview: string
  usage: string
  lastUpdated: string
}

const templates: TemplateRow[] = [
  { id: 1, name: 'Welcome Message', category: 'Onboarding', preview: 'Welcome to COPE! Reply with your name to get started.', usage: '145 flows', lastUpdated: '2024-03-01' },
  { id: 2, name: 'Daily Check-in', category: 'Survey', preview: 'How are you feeling today? Reply 1 for Good, 2 for OK, 3 for Not Well.', usage: '092 flows', lastUpdated: '2024-03-04' },
  { id: 3, name: 'Emergency Alert', category: 'Emergency', preview: 'URGENT: Emergency detected. Please respond immediately.', usage: '025 flows', lastUpdated: '2024-02-28' },
  { id: 4, name: 'Medication Reminder', category: 'Reminder', preview: 'Time to take your medication. Reply DONE when completed.', usage: '066 flows', lastUpdated: '2024-03-10' },
  { id: 5, name: 'Appointment Confirmation', category: 'Reminder', preview: 'You have an appointment tomorrow at 3PM. Reply YES to confirm.', usage: '254 flows', lastUpdated: '2024-03-02' },
]
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">Templates</h1>
        <p class="mt-2 text-base text-[#64748b]">Manage reusable SMS message templates</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus-20-solid" label="New Template" />
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Name</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Category</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Message Preview</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Usage</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Last Updated</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in templates"
              :key="template.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-6 py-4 font-medium text-[#102a43]">{{ template.name }}</td>
              <td class="px-6 py-4">
                <UBadge :label="template.category" color="primary" variant="solid" />
              </td>
              <td class="px-6 py-4 max-w-[360px] truncate text-[#64748b]">{{ template.preview }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ template.usage }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ template.lastUpdated }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <UButton icon="i-heroicons-arrow-uturn-left-20-solid" color="neutral" variant="ghost" size="xs" />
                  <UButton icon="i-heroicons-pencil-square-20-solid" color="neutral" variant="ghost" size="xs" />
                  <UButton icon="i-heroicons-trash-20-solid" color="error" variant="ghost" size="xs" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
