<script setup lang="ts">
import { useAppSearch } from '~/composables/useAppSearch'

const stats = [
  {
    title: 'Total Messages',
    value: '1,247',
    subtitle: 'Today',
    valueClass: 'text-gray-900 dark:text-white'
  },
  {
    title: 'Delivered',
    value: '1,189',
    subtitle: '95.3% success rate',
    valueClass: 'text-green-600 dark:text-green-400'
  },
  {
    title: 'Failed',
    value: '42',
    subtitle: '3.4% failure rate',
    valueClass: 'text-red-600 dark:text-red-400'
  },
  {
    title: 'Pending',
    value: '16',
    subtitle: 'In queue',
    valueClass: 'text-amber-500 dark:text-amber-400'
  }
]

const keywordOptions = ['All Keywords', 'HELP', 'COPE', 'EMERGENCY', 'CALM']
const statusOptions = ['All Status', 'Delivered', 'Failed', 'Pending']

const selectedKeyword = ref('All Keywords')
const selectedStatus = ref('All Status')
const appSearch = useAppSearch()

const logs = ref([
  {
    id: 1,
    timestamp: '2024-03-05 14:45:23',
    phoneNumber: '(555) 123-4567',
    keyword: 'HELP',
    workflowStep: 'Step 1: Initial Response',
    messageSent: 'We understand your baby may need support right now. Reply SAFE if you are okay or EMERGENCY if you need urgent help.',
    status: 'Delivered'
  },
  {
    id: 2,
    timestamp: '2024-03-05 14:32:15',
    phoneNumber: '(555) 234-5678',
    keyword: 'COPE',
    workflowStep: 'Step 2: Calming Techniques',
    messageSent: 'Try these calming techniques: take 3 slow breaths, relax your shoulders, and focus on one thing you can hear.',
    status: 'Delivered'
  },
  {
    id: 3,
    timestamp: '2024-03-05 14:18:47',
    phoneNumber: '(555) 345-6789',
    keyword: 'EMERGENCY',
    workflowStep: 'Step 1: Emergency Contacts',
    messageSent: 'Emergency contacts: National Maternal Mental Health Hotline, 911 if immediate danger, and your local emergency support.',
    status: 'Failed'
  },
  {
    id: 4,
    timestamp: '2024-03-05 13:54:32',
    phoneNumber: '(555) 456-7890',
    keyword: 'HELP',
    workflowStep: 'Step 3: Breathing Exercises',
    messageSent: 'Take a deep breath. Here are 3 guided breathing exercises you can try in the next two minutes.',
    status: 'Delivered'
  },
  {
    id: 5,
    timestamp: '2024-03-05 13:42:18',
    phoneNumber: '(555) 567-8901',
    keyword: 'CALM',
    workflowStep: 'Step 1: Initial Response',
    messageSent: 'We are here to help you stay grounded. Start by naming 5 things you can see around you.',
    status: 'Pending'
  }
])

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const matchesKeyword =
      selectedKeyword.value === 'All Keywords' || log.keyword === selectedKeyword.value

    const matchesStatus =
      selectedStatus.value === 'All Status' || log.status === selectedStatus.value

    const q = appSearch.value.trim().toLowerCase()
    const matchesSearch =
      !q ||
      log.phoneNumber.toLowerCase().includes(q) ||
      log.messageSent.toLowerCase().includes(q) ||
      log.keyword.toLowerCase().includes(q) ||
      log.workflowStep.toLowerCase().includes(q) ||
      log.timestamp.toLowerCase().includes(q)

    return matchesKeyword && matchesStatus && matchesSearch
  })
})

function keywordBadgeColor(keyword: string) {
  if (keyword === 'EMERGENCY') return 'error'
  return 'primary'
}

function statusBadgeColor(status: string) {
  if (status === 'Delivered') return 'success'
  if (status === 'Failed') return 'error'
  if (status === 'Pending') return 'warning'
  return 'neutral'
}
</script>

<template>
  <UContainer class="py-10 space-y-8">
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Message Logs
        </h1>
        <p class="mt-2 text-lg text-gray-500 dark:text-gray-400">
          View and analyze all SMS activity and delivery status
        </p>
      </div>

      <UButton
        icon="i-heroicons-arrow-down-tray"
        label="Export Logs"
        color="neutral"
        variant="outline"
        size="lg"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <UCard v-for="stat in stats" :key="stat.title" class="rounded-2xl">
        <div class="space-y-6 min-h-[160px] flex flex-col justify-between">
          <p class="text-lg font-semibold text-gray-500 dark:text-gray-400">
            {{ stat.title }}
          </p>

          <div>
            <p class="text-4xl font-bold" :class="stat.valueClass">
              {{ stat.value }}
            </p>
            <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {{ stat.subtitle }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="rounded-2xl overflow-hidden">
      <div class="flex flex-col xl:flex-row gap-4 mb-6">
        <UInput
          v-model="appSearch"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by phone number or message..."
          class="flex-1"
          size="xl"
          :ui="copeFieldUi"
        />

        <USelect
          v-model="selectedKeyword"
          :items="keywordOptions"
          class="w-full xl:w-56"
          size="xl"
          :ui="copeFieldUi"
        />

        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          class="w-full xl:w-56"
          size="xl"
          :ui="copeFieldUi"
        />
      </div>

      <div class="overflow-x-auto -mx-6">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Timestamp
              </th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Phone Number
              </th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Keyword
              </th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Workflow Step
              </th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white min-w-[320px]">
                Message Sent
              </th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td class="py-4 px-6 text-gray-500 dark:text-gray-400 whitespace-nowrap align-top">
                {{ log.timestamp }}
              </td>

              <td class="py-4 px-6 text-gray-900 dark:text-white whitespace-nowrap align-top font-medium">
                {{ log.phoneNumber }}
              </td>

              <td class="py-4 px-6 align-top">
                <UBadge
                  :color="keywordBadgeColor(log.keyword)"
                  variant="soft"
                  size="lg"
                >
                  {{ log.keyword }}
                </UBadge>
              </td>

              <td class="py-4 px-6 text-gray-900 dark:text-white whitespace-nowrap align-top">
                {{ log.workflowStep }}
              </td>

              <td class="py-4 px-6 text-gray-600 dark:text-gray-300 align-top">
                <p class="line-clamp-2">
                  {{ log.messageSent }}
                </p>
              </td>

              <td class="py-4 px-6 align-top">
                <UBadge
                  :color="statusBadgeColor(log.status)"
                  variant="subtle"
                  size="lg"
                >
                  {{ log.status }}
                </UBadge>
              </td>
            </tr>

            <tr v-if="filteredLogs.length === 0">
              <td
                colspan="6"
                class="py-10 px-6 text-center text-gray-500 dark:text-gray-400"
              >
                No message logs found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>