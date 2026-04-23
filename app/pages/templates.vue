<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import SideBar from '~/components/SidebarNav.vue'

interface TemplateRow {
  id: number
  name: string
  category: string
  preview: string
  usage: string
  lastUpdated: string
}

const templates: TemplateRow[] = [
  {
    id: 1,
    name: 'Welcome Message',
    category: 'Onboarding',
    preview: 'Welcome to COPE! Reply with your name to get started.',
    usage: '145 flows',
    lastUpdated: '2024-03-01',
  },
  {
    id: 2,
    name: 'Daily Check-in',
    category: 'Survey',
    preview: 'How are you feeling today? Reply 1 for Good, 2 for OK, 3 for Not Well.',
    usage: '092 flows',
    lastUpdated: '2024-03-04',
  },
  {
    id: 3,
    name: 'Emergency Alert',
    category: 'Emergency',
    preview: 'URGENT: Emergency detected. Please respond immediately.',
    usage: '025 flows',
    lastUpdated: '2024-02-28',
  },
  {
    id: 4,
    name: 'Medication Reminder',
    category: 'Reminder',
    preview: 'Time to take your medication. Reply DONE when completed.',
    usage: '066 flows',
    lastUpdated: '2024-03-10',
  },
  {
    id: 5,
    name: 'Appointment Confirmation',
    category: 'Reminder',
    preview: 'You have an appointment tomorrow at 3PM. Reply YES to confirm.',
    usage: '254 flows',
    lastUpdated: '2024-03-02',
  },
]
</script>

<template>
   <div class="flex flex-col h-screen">
      <Appheader />
      <div class="flex flex-1 overflow-hidden">
        <SideBar />
        <main class="flex-1 overflow-y-auto">
          <UContainer class="py-6 space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Templates</h1>
                <p class="text-sm text-gray-500 dark:text-gray-300">Manage reusable SMS message templates</p>
              </div>

              <UButton color="success" icon="i-heroicons-plus-20-solid" label="New Template" />
            </div>

            <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-white/20">
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Category</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Message Preview</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Usage</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Last Updated</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="template in templates"
                      :key="template.id"
                      class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ template.name }}</td>
                      <td class="px-4 py-3">
                        <UBadge :label="template.category" color="primary" variant="solid" />
                      </td>
                      <td class="px-4 py-3 max-w-[360px] truncate text-gray-600 dark:text-gray-300">{{ template.preview }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ template.usage }}</td>
                      <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ template.lastUpdated }}</td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <UButton icon="i-heroicons-arrow-uturn-left-20-solid" color="neutral" variant="link" />
                          <UButton icon="i-heroicons-pencil-square-20-solid" color="success" variant="link" />
                          <UButton icon="i-heroicons-trash-20-solid" color="error" variant="link" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </UContainer>
        </main>   
      </div>
   </div> 
</template>

