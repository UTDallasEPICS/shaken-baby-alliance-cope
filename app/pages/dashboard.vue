<script setup lang="ts">
import { ref, computed } from 'vue'

interface DashMsg {
  id: string
  createdAt: string
  phone: string
  keywordDetected: string | null
  messageText: string | null
  direction: string | null
  status: string | null
}

const { data, error } = await useFetch('/api/dashboard')
if (error.value) console.error('[dashboard fetch error]', error.value)

const messages = computed(() => (data.value?.messages ?? []) as DashMsg[])
const stats = computed(() => data.value?.stats)

const search = ref('')
const selectedKeywords = ref<string[]>([])
const selectedTimeframe = ref<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL')
const timeframeOpen = ref(false)

const keywords = [
  { label: 'HELP',      color: '#0f766e', bg: 'rgba(15,118,110,0.12)',  border: '#6ee7b7' },
  { label: 'COPE',      color: '#0f766e', bg: 'rgba(15,118,110,0.12)',  border: '#6ee7b7' },
  { label: 'EMERGENCY', color: '#dc2626', bg: 'rgba(239,68,68,0.12)',   border: '#fca5a5' },
  { label: 'CALM',      color: '#b45309', bg: 'rgba(245,158,11,0.12)',  border: '#fcd34d' },
]

const statCards = computed(() => [
  {
    label: 'Messages Sent Today',
    value: stats.value?.messagesToday ?? 0,
    sub: stats.value?.percentChange != null
      ? `${stats.value.percentChange >= 0 ? '+' : ''}${stats.value.percentChange}% vs yesterday`
      : '+0% vs yesterday',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: 'i-heroicons-chat-bubble-bottom-center-text-20-solid',
  },
  {
    label: 'Active Keywords',
    value: stats.value?.activeKeywords ?? 0,
    sub: 'Configured triggers',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    icon: 'i-heroicons-key-20-solid',
  },
  {
    label: 'Active Workflows',
    value: stats.value?.activeWorkflow ?? 0,
    sub: 'Automated responses',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    icon: 'i-heroicons-arrow-path-20-solid',
  },
  {
    label: 'Active Caregivers',
    value: stats.value?.activeCaregivers ?? 0,
    sub: 'Enrolled in COPE',
    iconBg: '#d1fae5',
    iconColor: '#0f766e',
    icon: 'i-heroicons-user-group-20-solid',
  },
])

function toggleKeyword(kw: string) {
  const i = selectedKeywords.value.indexOf(kw)
  if (i >= 0) selectedKeywords.value.splice(i, 1)
  else selectedKeywords.value.push(kw)
}

function kwStyle(kw: string | null) {
  const found = keywords.find(k => k.label === (kw ?? '').toUpperCase())
  if (!found) return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
  return { bg: found.bg, color: found.color, border: found.border }
}

const todayStart = computed(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
const tomorrowStart = computed(() => { const d = new Date(todayStart.value); d.setDate(d.getDate()+1); return d })
const weekStart = computed(() => { const d = new Date(todayStart.value); d.setDate(d.getDate()-6); return d })
const monthStart = computed(() => { const d = new Date(todayStart.value); d.setDate(1); return d })

const filteredMessages = computed(() => {
  const tf = messages.value.filter((msg: DashMsg) => {
    const c = new Date(msg.createdAt)
    switch (selectedTimeframe.value) {
      case 'TODAY':     return c >= todayStart.value && c < tomorrowStart.value
      case 'YESTERDAY': return c >= new Date(todayStart.value.getTime()-86400000) && c < todayStart.value
      case 'THIS_WEEK': return c >= weekStart.value && c < tomorrowStart.value
      case 'THIS_MONTH':return c >= monthStart.value && c < tomorrowStart.value
      default:          return true
    }
  })
  const kf = selectedKeywords.value.length > 0
    ? tf.filter((m: DashMsg) => selectedKeywords.value.includes((m.keywordDetected ?? '').toUpperCase()))
    : tf
  if (!search.value.trim()) return kf
  const term = search.value.trim().toLowerCase()
  return kf.filter((m: DashMsg) =>
    String(m.phone ?? '').toLowerCase().includes(term) ||
    String(m.messageText ?? '').toLowerCase().includes(term) ||
    String(m.keywordDetected ?? '').toLowerCase().includes(term)
  )
})

const filterLabel = computed(() => ({
  ALL: 'All Messages', TODAY: 'Today', YESTERDAY: 'Yesterday',
  THIS_WEEK: 'This Week', THIS_MONTH: 'This Month'
})[selectedTimeframe.value] ?? 'All Messages')

const timeframeOptions = [
  { label: 'All Messages', value: 'ALL' },
  { label: 'Today',        value: 'TODAY' },
  { label: 'Yesterday',    value: 'YESTERDAY' },
  { label: 'This Week',    value: 'THIS_WEEK' },
  { label: 'This Month',   value: 'THIS_MONTH' },
]

function selectTimeframe(v: string) {
  selectedTimeframe.value = v as any
  timeframeOpen.value = false
}

function statusStyle(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'delivered' || s === 'outbound') return { dot: '#16a34a', text: '#15803d', label: 'Delivered' }
  if (s === 'failed')   return { dot: '#dc2626', text: '#b91c1c', label: 'Failed' }
  if (s === 'inbound')  return { dot: '#f59e0b', text: '#b45309', label: 'Inbound' }
  return { dot: '#f59e0b', text: '#b45309', label: 'Inbound' }
}

watch([selectedKeywords, selectedTimeframe], () => {})
</script>

<template>
  <div class="max-w-[1200px] mx-auto p-6 space-y-6">

    <!-- Stat Cards — 5 columns -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-2xl border border-[#e7edf3] bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <!-- Label + Icon row -->
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-medium text-[#64748b] leading-snug">{{ card.label }}</p>
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            :style="`background:${card.iconBg};`"
          >
            <UIcon :name="card.icon" :style="`width:18px;height:18px;color:${card.iconColor};`" />
          </div>
        </div>
        <!-- Value + trend -->
        <div class="mt-4">
          <p class="text-3xl font-bold text-[#102a43]">{{ card.value }}</p>
          <p class="mt-1 text-xs text-[#94a3b8]">{{ card.sub }}</p>
        </div>
      </div>
    </div>

    <!-- Recent SMS Activity -->
    <div class="rounded-2xl border border-[#e7edf3] bg-white shadow-sm overflow-hidden">

      <!-- Section Header -->
      <div class="px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-bold text-[#102a43]">Recent SMS Activity</h2>
            <p class="mt-0.5 text-sm text-[#64748b]">Latest SMS interactions with caregivers</p>
          </div>

          <!-- Keyword filters + timeframe + total -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="kw in keywords"
              :key="kw.label"
              class="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
              :style="selectedKeywords.includes(kw.label)
                ? `background:${kw.bg};color:${kw.color};border-color:${kw.border};`
                : 'background:#f8fbff;color:#64748b;border-color:#e7edf3;'"
              @click="toggleKeyword(kw.label)"
            >{{ kw.label }}</button>

            <!-- Timeframe dropdown -->
            <div class="relative">
              <button
                class="flex items-center gap-1.5 rounded-full border border-[#e7edf3] bg-[#f8fbff] px-3 py-1 text-xs font-medium text-[#475569] hover:bg-[#f1f5f9] transition"
                @click="timeframeOpen = !timeframeOpen"
              >
                <UIcon name="i-heroicons-adjustments-horizontal-20-solid" style="width:13px;height:13px;" />
                {{ filterLabel }}
                <UIcon name="i-heroicons-chevron-down-20-solid" style="width:12px;height:12px;" />
              </button>
              <div
                v-if="timeframeOpen"
                class="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-[#e7edf3] bg-white shadow-lg overflow-hidden"
              >
                <button
                  v-for="opt in timeframeOptions"
                  :key="opt.value"
                  class="flex w-full items-center px-4 py-2.5 text-xs text-[#475569] hover:bg-[#f8fbff] transition"
                  :class="selectedTimeframe === opt.value ? 'font-semibold text-[#0f766e]' : ''"
                  @click="selectTimeframe(opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>

            <span class="rounded-full bg-[#0f766e] px-3 py-1 text-xs font-bold text-white">
              {{ filteredMessages.length }} Total
            </span>
          </div>
        </div>

        <!-- Search -->
        <div class="mt-4 flex h-10 max-w-xs items-center gap-2 rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:15px;height:15px;color:#94a3b8;" />
          <input
            v-model="search"
            placeholder="Search messages or phone number..."
            class="w-full bg-transparent text-sm outline-none text-[#102a43]"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[#f1f5f9] bg-[#f8fbff]">
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569] whitespace-nowrap">Date</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569] whitespace-nowrap">Time</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569] whitespace-nowrap">Phone Number</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569] whitespace-nowrap">Keyword</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569]">Message Sent</th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-[#475569] whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredMessages.length === 0">
              <td colspan="6" class="py-14 text-center text-sm text-[#94a3b8]">No messages found</td>
            </tr>
            <tr
              v-for="msg in filteredMessages"
              :key="msg.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-5 py-3 text-xs text-[#64748b] whitespace-nowrap">
                {{ new Date(msg.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-5 py-3 text-xs text-[#64748b] whitespace-nowrap">
                {{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </td>
              <td class="px-5 py-3 text-sm font-medium text-[#102a43] whitespace-nowrap">{{ msg.phone }}</td>
              <td class="px-5 py-3">
                <span
                  v-if="msg.keywordDetected"
                  class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  :style="`background:${kwStyle(msg.keywordDetected).bg};color:${kwStyle(msg.keywordDetected).color};border-color:${kwStyle(msg.keywordDetected).border};`"
                >{{ msg.keywordDetected.toUpperCase() }}</span>
                <span v-else class="text-[#94a3b8]">—</span>
              </td>
              <td class="px-5 py-3 text-sm text-[#475569] max-w-[280px] truncate">
                {{ msg.messageText || '—' }}
              </td>
              <td class="px-5 py-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold" :style="`color:${statusStyle(msg.status ?? msg.direction ?? '').text};`">
                  <span class="h-1.5 w-1.5 rounded-full flex-shrink-0" :style="`background:${statusStyle(msg.status ?? msg.direction ?? '').dot};`"></span>
                  {{ statusStyle(msg.status ?? msg.direction ?? '').label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
