<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

//Pretend data
const now = new Date()

const users = [
  { id: 1, time: new Date(now - 2 * 60000).toLocaleTimeString(), phone: '(555) 123-4567', keyword: 'HELP', workflowStep: 'Initial Response', message: 'We understand your baby may be crying. How...', status: 'Delivered' },
  { id: 2, time: new Date(now - 14 * 60000).toLocaleTimeString(), phone: '(555) 234-5678', keyword: 'COPE', workflowStep: 'Calming Techniques', message: 'Try these calming techniques: gentle rocking...', status: 'Delivered' },
  { id: 3, time: new Date(now - 60 * 60000).toLocaleTimeString(), phone: '(555) 345-6789', keyword: 'EMERGENCY', workflowStep: 'Emergency Support', message: 'If you need immediate help, call 1-800-CRISIS', status: 'Delivered' },
  { id: 4, time: new Date(now - 180 * 60000).toLocaleTimeString(), phone: '(555) 456-7890', keyword: 'HELP', workflowStep: 'Step 2 - Options', message: 'Reply with: 1-Crying tips, 2-Talk to someone...', status: 'Delivered' },
  { id: 5, time: new Date(now - 300 * 60000).toLocaleTimeString(), phone: '(555) 567-8901', keyword: 'CALM', workflowStep: 'Breathing Exercise', message: 'Take a deep breath. Breathe in for 4, hold for 4...', status: 'Delivered' },
]

const keywordColors: Record<string, 'primary' | 'success' | 'error' | 'warning'> = {
  HELP: 'primary',
  COPE: 'success',
  EMERGENCY: 'error',
  CALM: 'warning',
}

const stats = [
  { label: 'Messages Sent Today', value: 1247, icon: 'i-heroicons-chat-bubble-bottom-center-text-20-solid', change: '+12%' },
  { label: 'Active Keywords', value: 18, icon: 'i-heroicons-key-20-solid', change: '+2% this week' },
  { label: 'Active Workflows', value: 12, icon: 'i-heroicons-inbox-stack-20-solid', change: 'All configured' },
  { label: 'Active Caregivers', value: 47, icon: 'i-heroicons-user-group-20-solid', change: '+28%' },
]

</script>

<template>
  <UContainer class="py-8 space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p class="text-md text-gray-500 dark:text-gray-400 mt-1">Monitor your COPE text support system activity</p>
      </div>
  
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <UCard v-for="stat in stats" :key="stat.label" class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex items-center justify-between mb-3 ">
          <p class="text-md font-bold text-white-500 dark:text-white-400" >{{ stat.label }}</p>
          <UIcon :name="stat.icon" class="w-6 h-6 text-teal-600" />
        </div>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stat.value.toLocaleString() }}</p>
        <p class="text-md mt-1 flex items-center gap-1 text-white-800">
          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-3.8 h-3.8" />
          {{ stat.change }}
        </p>
      </UCard>
    </div>

    <!-- SMS Table -->
    <UCard class="!bg-white border-2 border-black rounded-xl p-3 dark:!bg-[#134e4a] dark:border-white">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-bold text-md dark:text-white">Recent SMS Activity</h2>
          <p class="text-sm text-black-300 mt-0.5 dark:text-gray-300">Latest SMS interactions with caregivers</p>
        </div>
        <UBadge variant="solid" color="primary">{{ users.length }} Total</UBadge>
      </div>
    </template>
    <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b dark:border-white/20">
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Time</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Phone Number</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Keyword</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Workflow Step</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Message Sent</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Status</th>
        </tr>
      </thead>

      <tbody class="divide-y dark:divide-white/10">
        <tr v-for="user in users" key="user.id" class="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <td class="py-3 px-3 dark:text-gray-300">{{ user.time }}</td>

          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <span class="dark:text-white">{{ user.phone }}</span>
            </div>
          </td>

          <td class="py-3 px-3">
            <UBadge :color="keywordColors[user.keyword]" variant="solid" size="md" class="text-black">
              {{ user.keyword }}
            </UBadge>
          </td>

          <td class="py-3 px-3 dark:text-white">{{ user.workflowStep }}</td>
          <td class="py-3 px-3 dark:text-gray-300 max-w-[250px] truncate">{{ user.message }}</td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5 text-green-700">
              <UIcon name="i-heroicons-check-circle-20-solid" class="w-4 h-4" />
              <span>{{ user.status }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </UCard>
  </UContainer>
</template>