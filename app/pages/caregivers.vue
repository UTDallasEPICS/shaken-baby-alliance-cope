<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import SideBar from '~/components/SidebarNav.vue'

interface CaregiverRow {
  id: number
  name: string
  phone: string
  email: string
  address: string
  cityState: string
  firstContact: string
  lastInteraction: string
  keywords: string[]
  status: 'active' | 'inactive'
}

function mapCaregiver(caregiver: any): Caregiver {
  const cityState = [caregiver.city, caregiver.state].filter(Boolean).join(', ')

  return {
    id: caregiver.id,
    name: caregiver.name || '',
    phone: caregiver.phone || '',
    email: caregiver.email || '',
    address: caregiver.address || '',
    cityState,
    firstContact: caregiver.firstContactDate
      ? new Date(caregiver.firstContactDate).toISOString().slice(0, 10)
      : '',
    lastInteraction: caregiver.lastInteraction
      ? new Date(caregiver.lastInteraction).toISOString().slice(0, 10)
      : '',
    keywords: caregiver.messages?.map((m: any) => m.keywordDetected).filter(Boolean) || [],
    status: caregiver.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
  }
}

function parseCityState(cityState: string) {
  const [city, state] = cityState.split(',').map((part) => part.trim())
  return { city: city || '', state: state || '' }
}

const caregivers = ref<Caregiver[]>([])
const searchQuery = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const availableKeywords = ['HELP', 'COPE', 'CALM', 'EMERGENCY']
const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  cityState: '',
  firstContact: '',
  lastInteraction: '',
  keywords: [] as string[],
  status: 'active' as 'active' | 'inactive',
})
const form = ref(emptyForm())
const editForm = ref<Caregiver | null>(null)

const { data: caregiversData, error: fetchError } = await useFetch<{ caregivers: any[] }>('/api/caregivers')
if (fetchError.value) {
  console.error('Failed to load caregivers', fetchError.value)
} else if (caregiversData.value?.caregivers) {
  caregivers.value = caregiversData.value.caregivers.map(mapCaregiver)
}

const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return caregivers.value
  return caregivers.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.cityState.toLowerCase().includes(q) ||
    c.keywords.some(k => k.toLowerCase().includes(q))
  )
})
const keywordColor: Record<string, string> = {
  HELP: 'primary',
  COPE: 'success',
  CALM: 'warning',
  EMERGENCY: 'error',
}

async function deleteCaregiver(id: string) {
  await $fetch('/api/caregivers', { method: 'DELETE', body: { id } })
  caregivers.value = caregivers.value.filter(c => c.id !== id)
}

const columns: TableColumn<Caregiver>[] = [
  { accessorKey: 'name',            header: 'Name' },
  { accessorKey: 'phone',           header: 'Phone Number' },
  { accessorKey: 'email',           header: 'Email' },
  { accessorKey: 'address',         header: 'Address' },
  { accessorKey: 'cityState',       header: 'City / State' },
  { accessorKey: 'firstContact',    header: 'First Contact' },
  { accessorKey: 'lastInteraction', header: 'Last Interaction' },
  {
    accessorKey: 'keywords',
    header: 'Keywords Used',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-wrap gap-1' },
        row.original.keywords.map(kw =>
          h(UBadge, { color: keywordColor[kw] ?? 'neutral', variant: 'subtle', size: 'xs' }, () => kw)
        )
      ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.status === 'active' ? 'success' : 'neutral',
        variant: 'subtle',
        size: 'sm',
      }, () => row.original.status),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1' }, [
        h(UButton, {
          icon: 'i-heroicons-chat-bubble-left-ellipsis-20-solid',
          color: 'neutral', variant: 'ghost', size: 'xs',
          title: 'View SMS Conversations',
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil-square-20-solid',
          color: 'neutral', variant: 'ghost', size: 'xs',
          title: 'Edit',
          onClick: () => openEditModal(row.original),
        }),
        h(UButton, {
          icon: 'i-heroicons-trash-20-solid',
          color: 'error', variant: 'ghost', size: 'xs',
          title: 'Delete',
          onClick: () => deleteCaregiver(row.original.id),
        }),
      ]),
  },
]

function toggleKeyword(kw: string) {
  const idx = form.value.keywords.indexOf(kw)
  if (idx === -1) form.value.keywords.push(kw)
  else form.value.keywords.splice(idx, 1)
}

async function saveCaregiver() {
  if (!form.value.name.trim() || !form.value.phone.trim() || !form.value.email.trim()) return

  const { city, state } = parseCityState(form.value.cityState)
  const payload = {
    name: form.value.name,
    phone: form.value.phone,
    email: form.value.email,
    address: form.value.address,
    city,
    state,
    firstContactDate: form.value.firstContact || undefined,
    lastInteraction: form.value.lastInteraction || undefined,
    status: form.value.status.toUpperCase(),
    messages: form.value.keywords.map((keyword) => ({ keywordDetected: keyword })),
  }

  const created = await $fetch<{ caregiver: any }>('/api/caregivers', { method: 'POST', body: payload })
  if (created?.caregiver) {
    caregivers.value.unshift(mapCaregiver(created.caregiver))
  }

  form.value = emptyForm()
  showAddModal.value = false
}

function cancelAdd() {
  form.value = emptyForm()
  showAddModal.value = false
}

function openEditModal(caregiver: Caregiver) {
  editForm.value = { ...caregiver, keywords: [...caregiver.keywords] }
  showEditModal.value = true
}

async function saveEdit() {
  if (!editForm.value) return

  const { city, state } = parseCityState(editForm.value.cityState)
  const payload = {
    id: editForm.value.id,
    name: editForm.value.name,
    phone: editForm.value.phone,
    email: editForm.value.email,
    address: editForm.value.address,
    city,
    state,
    status: editForm.value.status.toUpperCase(),
    firstContactDate: editForm.value.firstContact || undefined,
    lastInteraction: editForm.value.lastInteraction || undefined,
    messages: editForm.value.keywords.map((keyword) => ({ keywordDetected: keyword })),
  }

  const response = await $fetch<{ caregiver: any }>('/api/caregivers', { method: 'PUT', body: payload })
  if (response?.caregiver) {
    const updated = mapCaregiver(response.caregiver)
    const idx = caregivers.value.findIndex(c => c.id === updated.id)
    if (idx !== -1) caregivers.value[idx] = updated
  }

  showEditModal.value = false
  editForm.value = null
}

function cancelEdit() {
  showEditModal.value = false
  editForm.value = null
}

function toggleEditKeyword(kw: string) {
  if (!editForm.value) return
  const idx = editForm.value.keywords.indexOf(kw)
  if (idx === -1) editForm.value.keywords.push(kw)
  else editForm.value.keywords.splice(idx, 1)
}
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
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Caregivers</h1>
              <p class="text-sm text-gray-500 dark:text-gray-300">Manage caregiver profiles and assignments</p>
            </div>
            <UButton color="primary" icon="i-heroicons-plus-20-solid" label="New Caregiver" />
          </div>

          <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[980px] text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-white/20">
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Role</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Contact</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Patients</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="caregiver in caregivers"
                    :key="caregiver.id"
                    class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ caregiver.name }}</td>
                    <td class="px-4 py-3">
                      <UBadge :label="caregiver.role" color="primary" variant="solid" />
                    </td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <p>{{ caregiver.phone }}</p>
                      <p class="text-xs">{{ caregiver.email }}</p>
                    </td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ caregiver.patients }}</td>
                    <td class="px-4 py-3">
                      <UBadge :label="caregiver.status" :color="caregiver.status === 'Active' ? 'success' : 'neutral'" variant="solid" />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <UButton variant="link" color="success" icon="i-heroicons-pencil-square-20-solid" label="Edit" />
                        <UButton variant="link" color="error" icon="i-heroicons-trash-20-solid" label="Delete" />
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
