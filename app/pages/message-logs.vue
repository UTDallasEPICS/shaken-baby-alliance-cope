<script setup lang="ts">
const searchQuery = ref('')
const selectedKeyword = ref('All Keywords')
const selectedStatus = ref('All Status')
const exportOpen = ref(false)

const statusOptions = ['All Status', 'Delivered', 'Failed', 'Pending']

const { data, pending: loading } = await useFetch('/api/message-logs', {
  query: computed(() => ({
    keyword: selectedKeyword.value,
    status: selectedStatus.value,
    search: searchQuery.value || undefined
  })),
  watch: [selectedKeyword, selectedStatus, searchQuery]
})

const stats = computed(() => {
  const s = data.value?.stats
  if (!s) return []
  const successRate = s.total > 0 ? ((s.delivered / s.total) * 100).toFixed(1) : '0.0'
  const failRate = s.total > 0 ? ((s.failed / s.total) * 100).toFixed(1) : '0.0'
  return [
    { title: 'Total Messages', value: s.total.toLocaleString(), subtitle: 'All time', valueClass: 'text-[#102a43]' },
    { title: 'Delivered', value: s.delivered.toLocaleString(), subtitle: `${successRate}% success rate`, valueClass: 'text-green-600' },
    { title: 'Failed', value: s.failed.toLocaleString(), subtitle: `${failRate}% failure rate`, valueClass: 'text-red-600' },
    { title: 'Pending', value: s.pending.toLocaleString(), subtitle: 'In queue', valueClass: 'text-amber-500' }
  ]
})

const keywordOptions = computed(() => data.value?.keywordOptions ?? ['All Keywords'])
const logs = computed(() => data.value?.logs ?? [])

function keywordBadgeColor(keyword: string) {
  if (keyword === 'EMERGENCY') return 'error'
  if (keyword === 'CRISIS') return 'warning'
  return 'primary'
}

function statusBadgeColor(status: string) {
  if (status === 'Delivered') return 'success'
  if (status === 'Failed') return 'error'
  if (status === 'Pending') return 'warning'
  return 'neutral'
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString()
}

async function exportExcel() {
  exportOpen.value = false
  const { utils, writeFile } = await import('xlsx')
  const rows = logs.value.map((l: any) => ({
    Timestamp: formatTimestamp(l.timestamp),
    Contact: l.contactName ?? '',
    'Phone Number': l.phone,
    Keyword: l.keyword ?? '',
    Direction: l.direction ?? '',
    'Message Sent': l.messageSent ?? '',
    Status: l.status ?? '',
  }))
  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Message Logs')
  writeFile(wb, 'message-logs.xlsx')
}

async function exportPDF() {
  exportOpen.value = false
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Message Logs', 14, 15)
  autoTable(doc, {
    startY: 22,
    head: [['Timestamp', 'Contact', 'Phone Number', 'Keyword', 'Direction', 'Message Sent', 'Status']],
    body: logs.value.map((l: any) => [
      formatTimestamp(l.timestamp),
      l.contactName ?? '',
      l.phone ?? '',
      l.keyword ?? '',
      l.direction ?? '',
      l.messageSent ?? '',
      l.status ?? '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 118, 110] },
  })
  doc.save('message-logs.pdf')
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px] min-w-0 p-6 space-y-6 overflow-x-hidden">

    <!-- Export button row -->
    <div class="flex justify-end">
      <div class="relative">
        <button
          class="inline-flex items-center gap-2 rounded-2xl border border-[#e7edf3] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] shadow-sm hover:bg-[#f8fbff] transition"
          @click="exportOpen = !exportOpen"
        >
          <UIcon name="i-heroicons-arrow-down-tray-20-solid" style="width:16px;height:16px;" />
          Export Logs
          <UIcon name="i-heroicons-chevron-down-20-solid" style="width:13px;height:13px;" />
        </button>
        <div
          v-if="exportOpen"
          class="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-[#e7edf3] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.10)] overflow-hidden"
        >
          <button
            class="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#102a43] hover:bg-[#f0fdf4] transition"
            @click="exportExcel"
          >
            <UIcon name="i-heroicons-table-cells-20-solid" style="width:16px;height:16px;color:#16a34a;" />
            Export as Excel
          </button>
          <div class="border-t border-[#f1f5f9]"></div>
          <button
            class="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#102a43] hover:bg-[#fef2f2] transition"
            @click="exportPDF"
          >
            <UIcon name="i-heroicons-document-text-20-solid" style="width:16px;height:16px;color:#dc2626;" />
            Export as PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="rounded-[32px] border border-[#e7edf3] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
      >
        <p class="text-sm font-semibold text-[#64748b]">{{ stat.title }}</p>
        <p class="mt-4 text-4xl font-bold" :class="stat.valueClass">{{ stat.value }}</p>
        <p class="mt-2 text-sm text-[#64748b]">{{ stat.subtitle }}</p>
      </div>
    </div>

    <div class="min-w-0 rounded-[32px] border border-[#e7edf3] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] space-y-5 overflow-hidden">
      <div class="flex flex-col xl:flex-row gap-4">
        <div class="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:18px;height:18px;color:#94a3b8;" />
          <input
            v-model="searchQuery"
            placeholder="Search by phone number or message..."
            class="w-full bg-transparent text-sm outline-none text-[#102a43]"
          />
        </div>
        <USelect v-model="selectedKeyword" :items="keywordOptions" class="w-full xl:w-56" />
        <USelect v-model="selectedStatus" :items="statusOptions" class="w-full xl:w-56" />
      </div>

      <div v-if="loading" class="py-16 text-center text-sm text-[#64748b]">Loading...</div>

      <div v-else class="w-full min-w-0 overflow-x-auto">
        <table class="w-full min-w-[980px] table-fixed text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="w-[18%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Timestamp</th>
              <th class="w-[15%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Contact</th>
              <th class="w-[15%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Phone Number</th>
              <th class="w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Keyword</th>
              <th class="w-[11%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Direction</th>
              <th class="w-[23%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Message Sent</th>
              <th class="w-[8%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569] whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in logs"
              :key="log.id"
              class="border-t border-[#f1f5f9] row-hover"
            >
              <td class="py-4 px-5 text-[#64748b] whitespace-nowrap align-top">{{ formatTimestamp(log.timestamp) }}</td>
              <td class="py-4 px-5 font-medium text-[#102a43] whitespace-nowrap align-top">{{ log.contactName || 'Unknown Sender' }}</td>
              <td class="py-4 px-5 font-medium text-[#102a43] whitespace-nowrap align-top">{{ log.phone }}</td>
              <td class="py-4 px-5 align-top">
                <UBadge :color="keywordBadgeColor(log.keyword)" variant="soft">{{ log.keyword }}</UBadge>
              </td>
              <td class="py-4 px-5 text-[#64748b] whitespace-nowrap align-top uppercase text-xs tracking-wide">{{ log.direction }}</td>
              <td class="py-4 px-5 text-[#475569] align-top break-words"><p class="line-clamp-2">{{ log.messageSent }}</p></td>
              <td class="py-4 px-5 align-top">
                <UBadge :color="statusBadgeColor(log.status)" variant="subtle">{{ log.status }}</UBadge>
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="7" class="py-10 px-5 text-center text-sm text-[#64748b]">No message logs found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
