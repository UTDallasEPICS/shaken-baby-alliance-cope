<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import { authClient } from '~/utils/auth-client'

//Fetch the data from prisma
const { data } = await useFetch('/api/dashboard')

// Access the messages array and stats from the API response
const messages = computed(() => data.value?.messages ?? [])
const stats = computed(() => data.value?.stats)

const selectedKeyword = ref<string | null>(null)
const keywords = ['HELP', 'COPE', 'EMERGENCY','CALM']

const filteredMessages = computed(() => {
  if (!selectedKeyword.value) return messages.value
  return messages.value.filter(msg => msg.keywordDetected?.toUpperCase() === selectedKeyword.value)
})

//Dropdown 
const filterOptions = [
  [
    { 
      label: 'All Messages',
      onSelect: () => selectedKeyword.value = null 
    }
  ],
  [
    { label: 'HELP', class: 'text-blue-500 font-bold', onSelect: () => selectedKeyword.value = 'HELP' },
    { label: 'COPE', class: 'text-green-500 font-bold', onSelect: () => selectedKeyword.value = 'COPE' },
    { label: 'EMERGENCY', class: 'text-red-500 font-bold', onSelect: () => selectedKeyword.value = 'EMERGENCY' },
    { label: 'CALM', class: 'text-yellow-500 font-bold', onSelect: () => selectedKeyword.value = 'CALM' }
  ]
]

const keywordColors: Record<string, 'primary' | 'success' | 'error' | 'warning'> = {
  HELP: 'primary',
  COPE: 'success',
  EMERGENCY: 'error',
  CALM: 'warning',
}
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(filteredMessages.value.length / 6))
const pageMessages = computed(() => {
  const start = (currentPage.value - 1) * 6
  return filteredMessages.value.slice(start, start + 6)
})

watch(selectedKeyword, () => {currentPage.value = 1})
</script>

<template>
  <Appheader />
 
  <UContainer class="py-8 space-y-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p class="text-md text-gray-700 dark:text-gray-300 mt-1">Monitor your COPE text support system activity</p>
      </div>
  
    </div>
   

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <!--Message Stats Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Messages Sent Today</p>
          <UIcon class="text-blue-400 dark:text-blue-300 w-6 h-6"  name="i-heroicons-chat-bubble-bottom-center-text-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.messagesToday ?? 0 }}</p>
        <p class="text-md mt-1 items-center flex gap-1">
          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-4 h-4"></UIcon>
          +12% 
        </p>
       
      </UCard>
      <!--Active Keywords Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Keywords</p>
          <UIcon class="text-yellow-400 dark:text-yellow-300 w-6 h-6" name="i-heroicons-key-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeKeywords ?? 0 }}</p>
        <p class="text-md mt-1 items-center flex gap-1">
          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-4 h-4"></UIcon>
          +2% 
        </p>
       
      </UCard>
      <!--Active Workflows Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Workflows</p>
          <UIcon class="text-purple-400 dark:text-purple-300 w-6 h-6" name="i-heroicons-inbox-stack-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeWorkflow ?? 0 }}</p>
        <p class="text-md mt-1 items-center flex gap-1">
          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-4 h-4"></UIcon>
          All configured
        </p>
       
      </UCard>
      <!--Active Caregivers Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Caregivers</p>
          <UIcon class="w-6 h-6" name="i-heroicons-user-group-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeCaregivers ?? 0 }}</p>
        <p class="text-md mt-1 items-center flex gap-1">
          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-4 h-4"></UIcon>
          +28% 
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

        <div class="flex items-center gap-2">
          <UDropdownMenu :items="filterOptions">
            <UButton
              variant="outline"
              color="primary"
              size="sm"
              icon="i-heroicons-adjustments-horizontal-20-solid"
              :label="selectedKeyword ?? 'Filter'"
              trailing-icon="i-heroicons-chevron-down-20-solid"
            />
          </UDropdownMenu>
          <UBadge variant="solid" color="primary">{{  filteredMessages.length }} Total</UBadge>
        </div>
      </div>
    </template>
    <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b dark:border-white/20">
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Date</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Time</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Phone Number</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Keyword</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Message Sent</th>
          <th class="text-left py-3 px-3 text-md font-bold dark:text-gray-300">Status</th>
        </tr>
      </thead>

      <tbody class="divide-y dark:divide-white/10">
        <tr v-for="msg in pageMessages" :key="msg.id" class="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">

          <!--Date-->
          <td class="py-3 px-3 dark:text-gray-300">{{ new Date(msg.createdAt).toLocaleDateString() }}</td>
          <!--Time-->
          <td class="py-3 px-3 dark:text-gray-300">{{ new Date(msg.createdAt).toLocaleTimeString() }}</td>

          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <span class="dark:text-white">{{ msg.phone }}</span>
            </div>
          </td>

          <td class="py-3 px-3">
            <UBadge :color="keywordColors[msg.keywordDetected?.toUpperCase() ?? ''] ?? 'primary'" variant="solid" size="md" class="text-black">
              {{ msg.keywordDetected ?? 'N/A' }}
            </UBadge>
          </td>

      
          <td class="py-3 px-3 dark:text-gray-300 max-w-[250px] truncate">{{ msg.messageText }}</td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5 text-green-700 dark:text-green-500">
              <UIcon name="i-heroicons-check-circle-20-solid" class="w-4 h-4" />
              <span class="capitalize">{{ msg.direction }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <div v-if="totalPages >= 1" class="flex justify-center items-center gap-2 mt-4">
      <UButton
        icon="i-heroicons-chevron-left-20-solid"
        variant="ghost"
        color="primary"
        :disabled="currentPage === 1"
        @click="currentPage--"
      />
      <UButton
        v-for="page in totalPages"
        :key="page"
        :label="String(page)"
        size="sm"
        :variant="currentPage === page ? 'solid' : 'ghost'"
        color="primary"
        @click="currentPage = page"
      />

      <UButton
        icon="i-heroicons-chevron-right-20-solid"
        variant="ghost"
        color="primary"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      />
    </div>
  </UCard>
  </UContainer>
</template>