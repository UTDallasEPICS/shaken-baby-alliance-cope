<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Appheader from '~/components/Appheader.vue'
import { authClient } from '~/utils/auth-client'

//Fetch the data from prisma 
const { data } = await useFetch('/api/dashboard')

// Access the messages array and stats from the API response
const messages = computed(() => data.value?.messages ?? [])
const stats = computed(() => data.value?.stats)

const search = ref('')

const selectedKeywords = ref<string[]>([])
const selectedTimeframe = ref<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL')
const keywords = [
  { label: 'HELP', color: '#3b82f6' },
  { label: 'COPE', color: '#10b981' },
  { label: 'EMERGENCY', color: '#ef4444' },
  { label: 'CALM', color: '#eab308' }
]

// Toggle a keyword in the selectedKeywords array when a badge is clicked
const toggleKeyword = (keyword: string) => {
  const index = selectedKeywords.value.indexOf(keyword)
  if (index >= 0) {
    selectedKeywords.value.splice(index, 1)
  } else {
    selectedKeywords.value.push(keyword)
  }
}

// Get the style for a keyword badge based on whether it's active or not
const getKeywordBadgeStyle = (keyword?: string) => {
  const found = keywords.find(k => k.label === (keyword ?? '').toUpperCase())
  if (!found) return { backgroundColor: '#e5e7eb', color: '#111827' }
  return { backgroundColor: found.color, color: '#ffffff' }
}

// Compute the start times for today, tomorrow, this week, and this month to use in filtering
const todayStart = computed(() => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d
})
const tomorrowStart = computed(() => {
  const d = new Date(todayStart.value); d.setDate(d.getDate() + 1); return d
})
const weekStart = computed(() => {
  const d = new Date(todayStart.value); d.setDate(d.getDate() - 6); return d
})
const monthStart = computed(() => {
  const d = new Date(todayStart.value); d.setDate(1); return d
})

// Filter messages based on selected keyword, timeframe, and search term
const filteredMessages = computed(() => {
  const timeFiltered = messages.value.filter(msg => {
    const created = new Date(msg.createdAt)
    switch (selectedTimeframe.value) {
      case 'TODAY':
        return created >= todayStart.value && created < tomorrowStart.value
      case 'YESTERDAY':
        return created >= new Date(todayStart.value.getTime() - 86400000) && created < todayStart.value
      case 'THIS_WEEK':
        return created >= weekStart.value && created < tomorrowStart.value
      case 'THIS_MONTH':
        return created >= monthStart.value && created < tomorrowStart.value
      case 'ALL':
      default:
        return true
    }
  })

  // Keyword filter - if any keywords are selected, filter by those
  const keywordFiltered = selectedKeywords.value.length > 0
    ? timeFiltered.filter(msg => selectedKeywords.value.includes(msg.keywordDetected?.toUpperCase() ?? ''))
    : timeFiltered

  if (!search.value || !search.value.trim()) {
    return keywordFiltered
  }

  // Search section - filter by phone, message text, keyword, or status
  const term = search.value.trim().toLowerCase()
  return keywordFiltered.filter(msg =>
    String(msg.phone ?? '').toLowerCase().includes(term) ||
    String(msg.messageText ?? '').toLowerCase().includes(term) ||
    String(msg.keywordDetected ?? '').toLowerCase().includes(term) ||
    String(msg.status ?? '').toLowerCase().includes(term)
  )
})

//Dropdown options
const filterOptions = [
  [
    { label: 'All Messages', onSelect: () => selectedTimeframe.value = 'ALL' },
    { label: 'Today', onSelect: () => selectedTimeframe.value = 'TODAY' },
    { label: 'Yesterday', onSelect: () => selectedTimeframe.value = 'YESTERDAY' },
    { label: 'This Week', onSelect: () => selectedTimeframe.value = 'THIS_WEEK' },
    { label: 'This Month', onSelect: () => selectedTimeframe.value = 'THIS_MONTH' }
  ]
]

// Compute the label for the dropdown based on selected timeframe
const filterLabel = computed(() => {
  const timeframeNameMap = {
    ALL: 'All Messages',
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
    THIS_WEEK: 'This Week',
    THIS_MONTH: 'This Month'
  }
  return timeframeNameMap[selectedTimeframe.value] ?? 'All Messages'
})

// Handle the pages of the table, 4 messages per page
const currentPage = ref(1)
const pageSize = 4
const totalPages = computed(() => Math.ceil(filteredMessages.value.length / pageSize))
const pageMessages = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMessages.value.slice(start, start + pageSize)
})

// Reset to first page when filters change
watch([selectedKeywords, selectedTimeframe], () => { currentPage.value = 1 })
</script>

<template>
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
      </UCard>
      <!--Active Keywords Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Keywords</p>
          <UIcon class="text-yellow-400 dark:text-yellow-300 w-6 h-6" name="i-heroicons-key-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeKeywords ?? 0 }}</p>
        
       
      </UCard>
      <!--Active Workflows Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Workflows</p>
          <UIcon class="text-purple-400 dark:text-purple-300 w-6 h-6" name="i-heroicons-inbox-stack-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeWorkflow ?? 0 }}</p>
       
       
      </UCard>
      <!--Active Caregivers Card-->
      <UCard class="bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
        <div class="flex justify-between mb-3">
          <p class="text-1xl font-bold dark:text-white">Active Caregivers</p>
          <UIcon class="w-6 h-6" name="i-heroicons-user-group-20-solid"></UIcon>
        </div>
        <p class="text-3xl font-bold dark:text-white">{{ stats?.activeCaregivers ?? 0 }}</p>
        
       
      </UCard>
    </div>

    <!-- SMS Table -->
    <UCard class="!bg-white border-2 border-black rounded-xl p-3 dark:!bg-[#134e4a] dark:border-white">
    <template #header>
      <div class="flex flex-wrap justify-between gap-6 mb-4">
        <div class="flex-1 min-w-[280px]">
          <h2 class="font-bold text-md dark:text-white">Recent SMS Activity</h2>
          <p class="text-sm text-black-300 mt-0.5 dark:text-gray-300">Latest SMS interactions with caregivers</p>

          <div class="[&_input::placeholder]:text-gray-400 mt-3 w-full md:w-1/2">
            <UInput
              v-model="search"
              placeholder="Search messages or phone number..."
              icon="i-heroicons-magnifying-glass-20-solid"
              size="lg"
              class="w-full rounded-xl shadow-sm"
              :ui="{ base: '!bg-white dark:!bg-[#173933] !border-2 !border-black dark:!border-gray-600 !text-gray-800 dark:!text-white !py-2' }"
            />
          </div>
        </div>

        <div class="flex-1 min-w-[260px] flex flex-col items-end gap-3">
          <div class="flex flex-wrap justify-end gap-2">
            <button
              v-for="k in keywords"
              :key="k.label"
              type="button"
              @click="toggleKeyword(k.label)"
              :class="[
                'keyword-btn',
                selectedKeywords.includes(k.label) ? 'active' : ''
              ]"
              :style="{ '--keyword-color': k.color }"
              aria-label="Toggle keyword {{ k.label }}"
            >
              {{ k.label }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <UDropdownMenu :items="filterOptions">
              <UButton
                variant="outline"
                color="primary"
                size="sm"
                icon="i-heroicons-adjustments-horizontal-20-solid"
                :label="filterLabel"
                trailing-icon="i-heroicons-chevron-down-20-solid"
              />
            </UDropdownMenu>
            <UBadge variant="solid" color="primary">{{ filteredMessages.length }} Total</UBadge>
          </div>
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

          <td class="py-3 px-3 dark:text-gray-300">{{ new Date(msg.createdAt).toLocaleDateString() }}</td>
          <td class="py-3 px-3 dark:text-gray-300">{{ new Date(msg.createdAt).toLocaleTimeString() }}</td>

          <td class="py-3 px-3">
            <div class="flex items-center gap-2">
              <span class="dark:text-white">{{ msg.phone }}</span>
            </div>
          </td>

          <td class="py-3 px-3">
            <UBadge variant="solid" size="md" :style="getKeywordBadgeStyle(msg.keywordDetected?.toUpperCase())">
                  {{ msg.keywordDetected ?? 'N/A' }}
                </UBadge>
          </td>

      
          <td class="py-3 px-3 dark:text-gray-300 max-w-[250px] truncate">{{ msg.messageText }}</td>
          <td class="py-3 px-3">
            <div class="flex items-center gap-1.5">
              <UIcon
                v-if="msg.status === 'delivered' || msg.status === 'DELIVERED'"
                name="i-heroicons-check-circle-20-solid"
                class="w-4 h-4 text-green-700 dark:text-green-500"
              />
              <UIcon
                v-else
                name="i-heroicons-clock-20-solid"
                class="w-4 h-4 text-yellow-600 dark:text-yellow-400"
              />
              <span class="capitalize">{{ msg.status ?? 'PENDING' }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <div v-if="totalPages >= 1" class="flex flex-col items-center gap-2 mt-4">
      <p class="text-sm text-gray-500 dark:text-gray-300">Page {{ currentPage }} of {{ totalPages }}</p>
      <div class="flex justify-center items-center gap-2">
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
  </div>
  </UCard>
  </UContainer>
</template>