<script setup lang="ts">
const exportOpen = ref(false)

type Status = 'active' | 'inactive' | 'deleted'

type Caregiver = {
  id: string
  name: string
  phone: string
  email: string
  address: string
  cityState: string
  firstContact: string
  lastInteraction: string
  keywords: string[]
  status: Status
}

function mapCaregiver(c: any): Caregiver {
  return {
    id: c.id,
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    cityState: [c.city, c.state].filter(Boolean).join(', '),
    firstContact: c.firstContactDate ? new Date(c.firstContactDate).toLocaleDateString() : '',
    lastInteraction: c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : '',
    keywords: c.keywords || [],
    status: c.status?.toLowerCase() === 'deleted' ? 'deleted' : c.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
  }
}

function parseCityState(cityState: string) {
  const [city, state] = cityState.split(',').map(p => p.trim())
  return { city: city || '', state: state || '' }
}

const { confirm } = useConfirm()
const { show: showToast } = useAppToast()

const caregivers = ref<Caregiver[]>([])
const searchQuery = ref('')
const showAddCard = ref(false)
const showEditModal = ref(false)
const showDeletedSection = ref(false)
const availableKeywords = ['HELP', 'COPE', 'CALM', 'EMERGENCY']
const filterOpen = ref(false)
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
const filterContainer = ref<HTMLElement | null>(null)

onMounted(() => document.addEventListener('click', (e) => {
  if (filterContainer.value && !filterContainer.value.contains(e.target as Node)) filterOpen.value = false
}))

const emptyForm = () => ({
  name: '', phone: '', email: '', address: '', cityState: '',
  firstContact: '', lastInteraction: '',
  keywords: [] as string[],
  status: 'active' as 'active' | 'inactive',
})
const form = ref(emptyForm())
const editForm = ref<(Omit<Caregiver, 'status'> & { status: 'active' | 'inactive' }) | null>(null)

const { data: caregiversData, error: fetchError } = await useFetch<{ caregivers: any[] }>('/api/caregivers')
if (fetchError.value) {
  console.error('Failed to load caregivers', fetchError.value)
} else if (caregiversData.value?.caregivers) {
  caregivers.value = caregiversData.value.caregivers.map(mapCaregiver)
}

const activeCaregivers = computed(() =>
  caregivers.value.filter(c => c.status !== 'deleted')
)
const activeOnlyCaregivers = computed(() =>
  caregivers.value.filter(c => c.status === 'active')
)
const inactiveCaregivers = computed(() =>
  caregivers.value.filter(c => c.status === 'inactive')
)
const deletedCaregivers = computed(() =>
  caregivers.value.filter(c => c.status === 'deleted')
)

const filteredActive = computed(() => {
  const q = searchQuery.value.toLowerCase()
  let list = activeCaregivers.value
  if (filterStatus.value === 'active') list = list.filter(c => c.status === 'active')
  else if (filterStatus.value === 'inactive') list = list.filter(c => c.status === 'inactive')
  if (!q) return list
  return list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.cityState.toLowerCase().includes(q)
  )
})

const CG_PAGE_SIZE = 30
const cgPage = ref(1)

watch(filteredActive, () => { cgPage.value = 1 })

const cgTotalPages = computed(() => Math.max(1, Math.ceil(filteredActive.value.length / CG_PAGE_SIZE)))
const pagedActive = computed(() => {
  const start = (cgPage.value - 1) * CG_PAGE_SIZE
  return filteredActive.value.slice(start, start + CG_PAGE_SIZE)
})
const cgPageStart = computed(() => (cgPage.value - 1) * CG_PAGE_SIZE + 1)
const cgPageEnd = computed(() => Math.min(cgPage.value * CG_PAGE_SIZE, filteredActive.value.length))

const cgPageNumbers = computed(() => {
  const total = cgTotalPages.value
  const cur = cgPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | string)[]
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('…')
  const lo = Math.max(2, cur - 1)
  const hi = Math.min(total - 1, cur + 1)
  for (let i = lo; i <= hi; i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
})

const filteredDeleted = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return deletedCaregivers.value
  return deletedCaregivers.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.email.toLowerCase().includes(q)
  )
})

// ── Add ────────────────────────────────────────────────────────────────────
function toggleAddCard() {
  showAddCard.value = !showAddCard.value
  if (!showAddCard.value) form.value = emptyForm()
}

function toggleKeyword(kw: string) {
  const idx = form.value.keywords.indexOf(kw)
  if (idx === -1) form.value.keywords.push(kw)
  else form.value.keywords.splice(idx, 1)
}

async function saveCaregiver() {
  if (!form.value.name.trim() || !form.value.phone.trim()) return
  const { city, state } = parseCityState(form.value.cityState)
  const created = await $fetch<{ caregiver: any }>('/api/caregivers', {
    method: 'POST',
    body: { ...form.value, city, state, status: form.value.status.toUpperCase(), keywords: form.value.keywords },
  })
  if (created?.caregiver) caregivers.value.unshift(mapCaregiver(created.caregiver))
  form.value = emptyForm()
  showAddCard.value = false
  showToast('Caregiver added successfully', 'success')
}

// ── Edit ───────────────────────────────────────────────────────────────────
function openEditModal(c: Caregiver) {
  editForm.value = {
    ...c,
    keywords: [...c.keywords],
    status: c.status === 'deleted' ? 'inactive' : c.status,
  }
  showEditModal.value = true
}

function toggleEditKeyword(kw: string) {
  if (!editForm.value) return
  const idx = editForm.value.keywords.indexOf(kw)
  if (idx === -1) editForm.value.keywords.push(kw)
  else editForm.value.keywords.splice(idx, 1)
}

async function saveEdit() {
  if (!editForm.value) return
  const { city, state } = parseCityState(editForm.value.cityState)
  const response = await $fetch<{ caregiver: any }>('/api/caregivers', {
    method: 'PUT',
    body: { ...editForm.value, city, state, status: editForm.value.status.toUpperCase(), keywords: editForm.value.keywords },
  })
  if (response?.caregiver) {
    const updated = mapCaregiver(response.caregiver)
    const idx = caregivers.value.findIndex(c => c.id === updated.id)
    if (idx !== -1) caregivers.value.splice(idx, 1, updated)
  }
  showEditModal.value = false
  editForm.value = null
  showToast('Caregiver updated successfully', 'success')
}

function cancelEdit() { showEditModal.value = false; editForm.value = null }

// ── Status toggle ──────────────────────────────────────────────────────────
async function toggleStatus(c: Caregiver) {
  const newStatus = c.status === 'active' ? 'inactive' : 'active'
  const ok = await confirm(
    c.status === 'active'
      ? `${c.name} will be marked as inactive. Are you sure you want to continue?`
      : `${c.name} will be marked as active. Are you sure you want to continue?`,
    c.status === 'active' ? 'Deactivate Caregiver?' : 'Activate Caregiver?',
    c.status === 'active' ? 'Yes, Deactivate' : 'Yes, Activate',
    false
  )
  if (!ok) return

  const { city, state } = parseCityState(c.cityState)
  await $fetch('/api/caregivers', {
    method: 'PUT',
    body: { ...c, city, state, status: newStatus.toUpperCase() },
  })
  const idx = caregivers.value.findIndex(x => x.id === c.id)
  if (idx !== -1) caregivers.value[idx] = { ...caregivers.value[idx], status: newStatus }
  showToast(`Caregiver marked as ${newStatus}`, 'success')
}

// ── Soft delete ────────────────────────────────────────────────────────────
async function confirmDelete(id: string, name: string) {
  const ok = await confirm(
    `${name} will be moved to deleted records. You can restore them later.`,
    'Delete Caregiver?',
    'Yes, Delete',
    true
  )
  if (!ok) return
  await $fetch('/api/caregivers', { method: 'DELETE', body: { id } })
  const idx = caregivers.value.findIndex(c => c.id === id)
  if (idx !== -1) caregivers.value[idx] = { ...caregivers.value[idx], status: 'deleted' }
  showDeletedSection.value = true
  showToast('Caregiver moved to deleted records', 'error')
}

// ── Restore ────────────────────────────────────────────────────────────────
async function restoreCaregiver(c: Caregiver) {
  const ok = await confirm(
    `Restore ${c.name} back to active caregivers?`,
    'Restore Caregiver?',
    'Yes, Restore',
    false
  )
  if (!ok) return
  const { city, state } = parseCityState(c.cityState)
  await $fetch('/api/caregivers', {
    method: 'PUT',
    body: { ...c, city, state, status: 'ACTIVE' },
  })
  const idx = caregivers.value.findIndex(x => x.id === c.id)
  if (idx !== -1) caregivers.value[idx] = { ...caregivers.value[idx], status: 'active' }
  showToast('Caregiver restored successfully', 'success')
}

function viewCaregiver(c: Caregiver) {
  navigateTo(`/caregivers/${c.id}`)
}

function caregiverExportRows(list: Caregiver[]): Record<string, string>[] {
  return list.map(c => ({
    Name: c.name,
    'Phone Number': c.phone,
    Email: c.email,
    Address: c.address || '-',
    'City / State': c.cityState || '-',
    'First Contact': c.firstContact || '-',
    'Last Interaction': c.lastInteraction || '-',
    Keywords: c.keywords.join(', '),
    Status: c.status.charAt(0).toUpperCase() + c.status.slice(1),
  }))
}

async function exportCaregiversExcel() {
  exportOpen.value = false
  const { utils, writeFile } = await import('xlsx')

  const headers = ['Name', 'Phone Number', 'Email', 'Address', 'City / State', 'First Contact', 'Last Interaction', 'Keywords', 'Status']
  const workbook = utils.book_new()

  const appendSheet = (name: string, list: Caregiver[]) => {
    const rows = caregiverExportRows(list)
    const worksheet = utils.aoa_to_sheet([
      headers,
      ...rows.map(row => headers.map(header => row[header as keyof typeof row] ?? ''))
    ])
    utils.book_append_sheet(workbook, worksheet, name)
  }

  appendSheet('Active', activeOnlyCaregivers.value)
  appendSheet('Inactive', inactiveCaregivers.value)
  appendSheet('Deleted', deletedCaregivers.value)

  writeFile(workbook, 'caregivers-directory.xlsx')
  showToast('Caregivers exported as Excel', 'success')
}

async function exportCaregiversPDF() {
  exportOpen.value = false
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape' })
  const headers = [['Name', 'Phone', 'Email', 'Address', 'City / State', 'First Contact', 'Last Interaction', 'Keywords', 'Status']]

  const addSection = (title: string, list: Caregiver[], color: [number, number, number]) => {
    const startY = ((doc as any).lastAutoTable?.finalY ?? 20) + 12
    doc.setFontSize(13)
    doc.text(title, 14, startY)
    autoTable(doc, {
      startY: startY + 4,
      head: headers,
      body: caregiverExportRows(list).map(row => [
        row.Name,
        row['Phone Number'],
        row.Email,
        row.Address,
        row['City / State'],
        row['First Contact'],
        row['Last Interaction'],
        row.Keywords,
        row.Status,
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: color },
      bodyStyles: { textColor: [16, 42, 67] },
    })
  }

  doc.setFontSize(16)
  doc.text('Caregiver Directory', 14, 14)
  addSection('Active Caregivers', activeOnlyCaregivers.value, [15, 118, 110])
  addSection('Inactive Caregivers', inactiveCaregivers.value, [100, 116, 139])
  addSection('Deleted Caregivers', deletedCaregivers.value, [220, 38, 38])

  doc.save('caregivers-directory.pdf')
  showToast('Caregivers exported as PDF', 'success')
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

    <div class="mx-auto grid max-w-[1240px] grid-cols-1 gap-4 xl:grid-cols-[0.9fr_0.95fr_0.85fr]">
      <button
        class="rounded-[28px] border border-[#fee2e2] bg-white px-6 py-5 text-left shadow-[0_20px_50px_rgba(220,38,38,0.06)] transition hover:bg-[#fff8f8]"
        @click="showDeletedSection = !showDeletedSection"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef2f2]">
              <UIcon name="i-heroicons-trash-20-solid" style="width:18px;height:18px;color:#dc2626;" />
            </div>
            <div>
              <p class="text-sm font-semibold text-[#991b1b]">Deleted Caregivers</p>
              <p class="mt-3 text-3xl font-bold text-[#dc2626]">{{ deletedCaregivers.length }}</p>
              <p class="mt-2 text-sm text-[#ef4444]">{{ deletedCaregivers.length > 0 ? 'Can be restored anytime' : 'No deleted caregivers' }}</p>
            </div>
          </div>
          <UIcon
            :name="showDeletedSection ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'"
            style="width:18px;height:18px;color:#dc2626;"
          />
        </div>
      </button>

      <div class="rounded-[28px] border border-[#e7edf3] bg-white px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-[#64748b]">Export Caregivers</p>
            <p class="mt-3 text-3xl font-bold text-[#102a43]">{{ caregivers.length }}</p>
            <p class="mt-2 text-sm text-[#64748b]">PDF and Excel with separate active, inactive, and deleted sections</p>
          </div>
          <div class="relative">
            <button
              class="inline-flex items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f1f5f9]"
              @click="exportOpen = !exportOpen"
            >
              <UIcon name="i-heroicons-arrow-down-tray-20-solid" style="width:16px;height:16px;" />
              Export
              <UIcon name="i-heroicons-chevron-down-20-solid" style="width:13px;height:13px;" />
            </button>
            <div
              v-if="exportOpen"
              class="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-[#e7edf3] bg-white shadow-[0_20px_40px_rgba(15,23,42,0.10)]"
            >
              <button
                class="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#102a43] hover:bg-[#f0fdf4] transition"
                @click="exportCaregiversExcel"
              >
                <UIcon name="i-heroicons-table-cells-20-solid" style="width:16px;height:16px;color:#16a34a;" />
                Export Excel
              </button>
              <div class="border-t border-[#f1f5f9]"></div>
              <button
                class="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#102a43] hover:bg-[#fef2f2] transition"
                @click="exportCaregiversPDF"
              >
                <UIcon name="i-heroicons-document-text-20-solid" style="width:16px;height:16px;color:#dc2626;" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        class="rounded-[28px] border border-[#f4df95] bg-white px-6 py-5 text-left shadow-[0_20px_50px_rgba(201,162,39,0.12)] transition hover:bg-[#fffcf2]"
        @click="toggleAddCard"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef9ec]">
              <UIcon :name="showAddCard ? 'i-heroicons-x-mark-20-solid' : 'i-heroicons-plus-20-solid'" style="width:18px;height:18px;color:#c9a227;" />
            </div>
            <div>
              <p class="text-sm font-semibold text-[#8a6d12]">Add Caregiver</p>
              <p class="mt-3 text-3xl font-bold text-[#c9a227]">+</p>
              <p class="mt-2 text-sm text-[#64748b]">{{ showAddCard ? 'Close the caregiver form' : 'Create a new caregiver record' }}</p>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- ── Add Caregiver Card ────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="showAddCard" class="rounded-[24px] border border-[#e7edf3] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] overflow-hidden">
        <div class="flex items-center justify-between px-7 py-5 border-b border-[#f1f5f9]">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full" style="background:#fef9ec;">
              <UIcon name="i-heroicons-user-plus-20-solid" style="width:18px;height:18px;color:#c9a227;" />
            </div>
            <p class="text-base font-semibold text-[#102a43]">New Caregiver</p>
          </div>
        </div>
        <div class="p-7">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div class="lg:col-span-3">
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Full Name <span class="text-red-500">*</span></label>
              <UInput v-model="form.name" placeholder="e.g. Sarah Johnson" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Phone Number <span class="text-red-500">*</span></label>
              <UInput v-model="form.phone" placeholder="+1 (555) 123-4567" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Email</label>
              <UInput v-model="form.email" type="email" placeholder="name@email.com" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">City / State</label>
              <UInput v-model="form.cityState" placeholder="Dallas, TX" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Address</label>
              <UInput v-model="form.address" placeholder="123 Main St" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">First Contact</label>
              <UInput v-model="form.firstContact" type="date" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Status</label>
              <div class="flex gap-2 mt-1">
                <button
                  v-for="s in ['active', 'inactive']"
                  :key="s"
                  type="button"
                  class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                  :class="form.status === s
                    ? s === 'active' ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-400 border-slate-400 text-white'
                    : 'bg-transparent border-[#e7edf3] text-[#64748b] hover:border-[#94a3b8]'"
                  @click="form.status = s as 'active' | 'inactive'"
                >{{ s }}</button>
              </div>
            </div>
            <div class="lg:col-span-3">
              <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Keywords</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="kw in availableKeywords"
                  :key="kw"
                  type="button"
                  class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                  :class="form.keywords.includes(kw) ? 'bg-[#0f766e] border-[#0f766e] text-white' : 'bg-transparent border-[#e7edf3] text-[#64748b] hover:border-[#0f766e] hover:text-[#0f766e]'"
                  @click="toggleKeyword(kw)"
                >{{ kw }}</button>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-5 border-t border-[#f1f5f9]">
            <button
              class="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] transition"
              @click="toggleAddCard"
            >Cancel</button>
            <button
              class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background:#c9a227;"
              :disabled="!form.name.trim() || !form.phone.trim()"
              @click="saveCaregiver"
            >
              <UIcon name="i-heroicons-plus-20-solid" style="width:14px;height:14px;display:inline;margin-right:4px;" />
              Add Caregiver
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Active Caregivers Table ──────────────────────────────────────── -->
    <div
      v-if="deletedCaregivers.length > 0 && showDeletedSection"
      class="rounded-[32px] border border-[#fee2e2] bg-white shadow-[0_8px_24px_rgba(220,38,38,0.06)] overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between px-7 py-5 text-left"
        @click="showDeletedSection = !showDeletedSection"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#fef2f2]">
            <UIcon name="i-heroicons-trash-20-solid" style="width:16px;height:16px;color:#dc2626;" />
          </div>
          <div>
            <p class="text-base font-semibold text-[#991b1b]">Deleted Caregivers</p>
            <p class="text-sm text-[#ef4444] mt-0.5">{{ deletedCaregivers.length }} record{{ deletedCaregivers.length !== 1 ? 's' : '' }} - can be restored</p>
          </div>
        </div>
        <UIcon
          name="i-heroicons-chevron-up-20-solid"
          style="width:18px;height:18px;color:#dc2626;"
        />
      </button>

      <Transition name="slide-down">
        <div v-if="showDeletedSection" class="border-t border-[#fee2e2] overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-[#fff5f5]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Phone Number</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">City / State</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">First Contact</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in filteredDeleted"
                :key="c.id"
                class="border-t border-[#fee2e2] hover:bg-[#fff5f5] transition duration-150 opacity-75"
              >
                <td class="px-4 py-3 font-medium text-[#7f1d1d] whitespace-nowrap line-through decoration-[#fca5a5]">{{ c.name }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.phone }}</td>
                <td class="px-4 py-3 text-[#ef4444] truncate max-w-[170px]">{{ c.email }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.cityState || 'â€”' }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.firstContact || 'â€”' }}</td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#86efac] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7] transition"
                    title="Restore caregiver"
                    @click="restoreCaregiver(c)"
                  >
                    <UIcon name="i-heroicons-arrow-path-20-solid" style="width:12px;height:12px;" />
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Transition>
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-7 py-4 sm:py-5 border-b border-[#f1f5f9]">
        <div>
          <p class="text-base font-semibold text-[#102a43]">Caregiver Directory</p>
          <p class="text-sm text-[#64748b] mt-0.5">{{ filteredActive.length }} total caregivers</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex h-10 items-center gap-2 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4">
            <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:16px;height:16px;color:#94a3b8;" />
            <input
              v-model="searchQuery"
              placeholder="Search caregivers..."
              class="bg-transparent text-sm outline-none w-44 text-[#102a43]"
            />
          </div>
          <div ref="filterContainer" class="relative">
            <button
              class="flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-sm font-medium transition"
              :class="filterStatus !== 'all' ? 'border-[#0f766e] bg-[#f0fdf4] text-[#0f766e]' : 'border-[#e7edf3] bg-[#f8fbff] text-[#64748b] hover:bg-[#f1f5f9]'"
              @click="filterOpen = !filterOpen"
            >
              <UIcon name="i-heroicons-funnel-20-solid" style="width:15px;height:15px;" />
              {{ filterStatus === 'all' ? 'Filter' : filterStatus === 'active' ? 'Active' : 'Inactive' }}
              <UIcon name="i-heroicons-chevron-down-20-solid" style="width:12px;height:12px;" />
            </button>
            <div
              v-if="filterOpen"
              class="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-[#e7edf3] bg-white shadow-lg overflow-hidden"
            >
              <button
                v-for="opt in [{ label: 'All Caregivers', value: 'all' }, { label: 'Active Only', value: 'active' }, { label: 'Inactive Only', value: 'inactive' }]"
                :key="opt.value"
                class="flex w-full items-center px-4 py-2.5 text-xs hover:bg-[#f8fbff] transition"
                :class="filterStatus === opt.value ? 'font-semibold text-[#0f766e]' : 'text-[#475569]'"
                @click="filterStatus = opt.value as any; filterOpen = false"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="caregivers-table w-full table-fixed text-sm border-collapse">
          <colgroup>
            <col class="w-[12%]">
            <col class="w-[11%]">
            <col class="w-[14%]">
            <col class="w-[13%]">
            <col class="w-[11%]">
            <col class="w-[9%]">
            <col class="w-[10%]">
            <col class="w-[9%]">
            <col class="w-[11%]">
          </colgroup>
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Name</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Phone Number</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Email</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Address</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">City / State</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">First Contact</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Last Interaction</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Status</th>
              <th class="px-3 py-3 text-left text-xs font-semibold text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredActive.length === 0">
              <td colspan="9" class="py-16 text-center text-sm text-[#64748b]">No caregivers found</td>
            </tr>
            <tr
              v-for="c in pagedActive"
              :key="c.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-3 py-3 font-medium text-[#102a43] truncate">{{ c.name }}</td>
              <td class="px-3 py-3 text-[#64748b] truncate">{{ c.phone }}</td>
              <td class="px-3 py-3 text-[#64748b] truncate">{{ c.email }}</td>
              <td class="px-4 py-3 text-[#64748b] whitespace-nowrap">{{ c.address || '—' }}</td>
              <td class="px-4 py-3 text-[#64748b] whitespace-nowrap">{{ c.cityState || '—' }}</td>
              <td class="px-4 py-3 text-[#64748b] whitespace-nowrap">{{ c.firstContact || '—' }}</td>
              <td class="px-4 py-3 text-[#64748b] whitespace-nowrap">{{ c.lastInteraction || '—' }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <!-- Status toggle pill -->
                <button
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                  :class="c.status === 'active'
                    ? 'bg-[#f0fdf4] border-[#86efac] text-[#15803d] hover:bg-[#dcfce7]'
                    : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'"
                  :title="`Click to mark as ${c.status === 'active' ? 'inactive' : 'active'}`"
                  @click="toggleStatus(c)"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="c.status === 'active' ? 'bg-green-500' : 'bg-slate-400'"
                  />
                  {{ c.status === 'active' ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7edf3] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] transition"
                    title="View caregiver"
                    @click="viewCaregiver(c)"
                  >
                    <UIcon name="i-heroicons-eye-20-solid" style="width:13px;height:13px;" />
                  </button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7edf3] bg-[#f0fdf4] text-[#0f766e] hover:bg-[#dcfce7] transition"
                    title="Edit"
                    @click="openEditModal(c)"
                  >
                    <UIcon name="i-heroicons-pencil-square-20-solid" style="width:13px;height:13px;" />
                  </button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7edf3] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition"
                    title="Delete"
                    @click="confirmDelete(c.id, c.name)"
                  >
                    <UIcon name="i-heroicons-trash-20-solid" style="width:13px;height:13px;" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="cgTotalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-[#f1f5f9]">
        <p class="text-xs text-[#64748b]">
          Showing {{ cgPageStart }}–{{ cgPageEnd }} of {{ filteredActive.length }} caregivers
        </p>
        <div class="flex items-center gap-1">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition"
            :disabled="cgPage === 1"
            @click="cgPage--"
          >
            <UIcon name="i-heroicons-chevron-left-20-solid" style="width:14px;height:14px;" />
          </button>
          <template v-for="p in cgPageNumbers" :key="String(p) + '_' + cgPageNumbers.indexOf(p)">
            <span v-if="typeof p === 'string'" class="px-1 text-sm text-[#94a3b8]">…</span>
            <button
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition"
              :class="cgPage === p ? 'bg-[#0f766e] text-white' : 'border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9]'"
              @click="cgPage = p as number"
            >{{ p }}</button>
          </template>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition"
            :disabled="cgPage === cgTotalPages"
            @click="cgPage++"
          >
            <UIcon name="i-heroicons-chevron-right-20-solid" style="width:14px;height:14px;" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Deleted Caregivers Card ───────────────────────────────────────── -->
    <div
      v-if="false"
      class="rounded-[32px] border border-[#fee2e2] bg-white shadow-[0_8px_24px_rgba(220,38,38,0.06)] overflow-hidden"
    >
      <!-- Collapsible header -->
      <button
        class="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-[#fff5f5] transition"
        @click="showDeletedSection = !showDeletedSection"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#fef2f2]">
            <UIcon name="i-heroicons-trash-20-solid" style="width:16px;height:16px;color:#dc2626;" />
          </div>
          <div>
            <p class="text-base font-semibold text-[#991b1b]">Deleted Caregivers</p>
            <p class="text-sm text-[#ef4444] mt-0.5">{{ deletedCaregivers.length }} record{{ deletedCaregivers.length !== 1 ? 's' : '' }} — can be restored</p>
          </div>
        </div>
        <UIcon
          :name="showDeletedSection ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'"
          style="width:18px;height:18px;color:#dc2626;"
        />
      </button>

      <!-- Deleted table -->
      <Transition name="slide-down">
        <div v-if="showDeletedSection" class="border-t border-[#fee2e2] overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-[#fff5f5]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Phone Number</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">City / State</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">First Contact</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#991b1b] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in filteredDeleted"
                :key="c.id"
                class="border-t border-[#fee2e2] hover:bg-[#fff5f5] transition duration-150 opacity-75"
              >
                <td class="px-4 py-3 font-medium text-[#7f1d1d] whitespace-nowrap line-through decoration-[#fca5a5]">{{ c.name }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.phone }}</td>
                <td class="px-4 py-3 text-[#ef4444] truncate max-w-[170px]">{{ c.email }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.cityState || '—' }}</td>
                <td class="px-4 py-3 text-[#ef4444] whitespace-nowrap">{{ c.firstContact || '—' }}</td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#86efac] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7] transition"
                    title="Restore caregiver"
                    @click="restoreCaregiver(c)"
                  >
                    <UIcon name="i-heroicons-arrow-path-20-solid" style="width:12px;height:12px;" />
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Transition>
    </div>

    <!-- ── Edit Modal ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="overlay">
        <div
          v-if="showEditModal && editForm"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);"
          @click.self="cancelEdit"
        >
          <Transition name="dialog">
            <div
              v-if="showEditModal"
              class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0fdf4]">
                    <UIcon name="i-heroicons-pencil-square-20-solid" style="width:16px;height:16px;color:#0f766e;" />
                  </div>
                  <h3 class="text-base font-bold text-[#102a43]">Edit Caregiver</h3>
                </div>
                <button class="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition" @click="cancelEdit">
                  <UIcon name="i-heroicons-x-mark-20-solid" style="width:16px;height:16px;" />
                </button>
              </div>

              <!-- Body -->
              <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Full Name <span class="text-red-500">*</span></label>
                  <input v-model="editForm.name" placeholder="e.g. Sarah Johnson" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Phone Number <span class="text-red-500">*</span></label>
                  <input v-model="editForm.phone" placeholder="(555) 123-4567" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Email</label>
                  <input v-model="editForm.email" type="email" placeholder="name@email.com" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Address</label>
                  <input v-model="editForm.address" placeholder="123 Main St" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">City / State</label>
                  <input v-model="editForm.cityState" placeholder="Dallas, TX" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">First Contact</label>
                  <input v-model="editForm.firstContact" type="date" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Last Interaction</label>
                  <input v-model="editForm.lastInteraction" type="date" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Keywords</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="kw in availableKeywords" :key="kw" type="button"
                      class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                      :class="editForm.keywords.includes(kw) ? 'bg-[#0f766e] border-[#0f766e] text-white' : 'bg-transparent border-[#e7edf3] text-[#64748b] hover:border-[#0f766e] hover:text-[#0f766e]'"
                      @click="toggleEditKeyword(kw)"
                    >{{ kw }}</button>
                  </div>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Status</label>
                  <div class="flex gap-2">
                    <button
                      v-for="s in ['active', 'inactive']" :key="s" type="button"
                      class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                      :class="editForm.status === s
                        ? s === 'active' ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-400 border-slate-400 text-white'
                        : 'bg-transparent border-[#e7edf3] text-[#64748b] hover:border-[#94a3b8]'"
                      @click="editForm!.status = s as 'active' | 'inactive'"
                    >{{ s }}</button>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="flex justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9]">
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] transition"
                  @click="cancelEdit"
                >Cancel</button>
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background:#0f766e;"
                  :disabled="!editForm.name.trim() || !editForm.phone.trim()"
                  @click="saveEdit"
                >Save Changes</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.slide-down-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-leave-active {
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.caregivers-table th,
.caregivers-table td {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.caregivers-table th {
  white-space: normal;
}

.caregivers-table td:nth-child(1),
.caregivers-table td:nth-child(2),
.caregivers-table td:nth-child(3),
.caregivers-table td:nth-child(4),
.caregivers-table td:nth-child(5) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
