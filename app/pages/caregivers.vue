<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

interface CaregiverRow {
  id: number
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

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

const toast = useToast()

const { data: caregiversData, refresh: refreshCaregivers } = await useFetch<CaregiverRow[]>('/api/caregivers', {
  default: () => [],
})

const caregivers = computed(() => caregiversData.value ?? [])

const appSearch = useAppSearch()
const filteredCaregivers = computed(() =>
  caregivers.value.filter((c) =>
    rowMatchesAppSearch(appSearch.value, c.name, c.role, c.phone, c.email, c.patients, c.status),
  ),
)

const isCaregiverModalOpen = ref(false)
const caregiverModalMode = ref<'create' | 'edit'>('create')

const caregiverForm = reactive<{
  id: number | null
  name: string
  role: string
  phone: string
  email: string
  patients: string
  status: 'Active' | 'Inactive'
}>({
  id: null,
  name: '',
  role: 'Primary Care',
  phone: '',
  email: '',
  patients: '0 assigned',
  status: 'Active',
})

function openCreateCaregiver() {
  caregiverModalMode.value = 'create'
  caregiverForm.id = null
  caregiverForm.name = ''
  caregiverForm.role = 'Primary Care'
  caregiverForm.phone = ''
  caregiverForm.email = ''
  caregiverForm.patients = '0 assigned'
  caregiverForm.status = 'Active'
  isCaregiverModalOpen.value = true
}

function openEditCaregiver(c: CaregiverRow) {
  caregiverModalMode.value = 'edit'
  caregiverForm.id = c.id
  caregiverForm.name = c.name
  caregiverForm.role = c.role
  caregiverForm.phone = c.phone
  caregiverForm.email = c.email
  caregiverForm.patients = c.patients
  caregiverForm.status = c.status
  isCaregiverModalOpen.value = true
}

async function submitCaregiver() {
  const name = caregiverForm.name.trim()
  const role = caregiverForm.role.trim()
  if (!name || !role) {
    toast.add({ title: 'Name and role are required', color: 'error' })
    return
  }

  const payload = {
    name,
    role,
    phone: caregiverForm.phone.trim(),
    email: caregiverForm.email.trim(),
    patients: caregiverForm.patients.trim(),
    status: caregiverForm.status,
  }

  if (caregiverModalMode.value === 'create') {
    await $fetch('/api/caregivers', { method: 'POST', body: payload })
    toast.add({ title: 'Caregiver created', color: 'success' })
  } else {
    await $fetch(`/api/caregivers/${caregiverForm.id}`, { method: 'PUT', body: payload })
    toast.add({ title: 'Caregiver updated', color: 'success' })
  }

  isCaregiverModalOpen.value = false
  await refreshCaregivers()
}

async function deleteCaregiver(caregiver: CaregiverRow) {
  const ok = confirm(`Delete caregiver "${caregiver.name}"?`)
  if (!ok) return
  await $fetch(`/api/caregivers/${caregiver.id}`, { method: 'DELETE' })
  await refreshCaregivers()
  toast.add({ title: 'Caregiver deleted', color: 'success' })
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
  <UContainer class="py-10">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Caregivers
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage caregiver contact information and interactions
        </p>
      </div>
      <UButton
        color="primary"
        icon="i-heroicons-plus-20-solid"
        label="New Caregiver"
        @click="openCreateCaregiver"
      />
    </div>

    <UModal
      v-model:open="isCaregiverModalOpen"
      :title="caregiverModalMode === 'create' ? 'New Caregiver' : 'Edit Caregiver'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name">
            <UInput v-model="caregiverForm.name" placeholder="Dr. Sarah Chen" :ui="copeFieldUi" />
          </UFormField>

          <UFormField label="Role">
            <UInput v-model="caregiverForm.role" placeholder="Primary Care" :ui="copeFieldUi" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Phone">
              <UInput v-model="caregiverForm.phone" placeholder="+1 (555) 123-4567" :ui="copeFieldUi" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="caregiverForm.email" placeholder="name@cope.com" :ui="copeFieldUi" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Patients">
              <UInput v-model="caregiverForm.patients" placeholder="0 assigned" :ui="copeFieldUi" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="caregiverForm.status" :items="['Active', 'Inactive']" :ui="copeFieldUi" />
            </UFormField>
          </div>
        icon="i-heroicons-plus-20-solid"
        label="Add Caregiver"
        color="primary"
        @click="showAddModal = true"
      />
    </div>

    <!-- Edit Caregiver Modal -->
    <UModal v-model:open="showEditModal" title="Edit Caregiver" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
        <div v-if="editForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput v-model="editForm.name" placeholder="e.g. Sarah Johnson" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span class="text-red-500">*</span>
            </label>
            <UInput v-model="editForm.phone" placeholder="(555) 123-4567" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <UInput v-model="editForm.email" type="email" placeholder="name@email.com" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <UInput v-model="editForm.address" placeholder="123 Main St" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / State</label>
            <UInput v-model="editForm.cityState" placeholder="Boston, MA" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Contact</label>
            <UInput v-model="editForm.firstContact" type="date" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Interaction</label>
            <UInput v-model="editForm.lastInteraction" type="date" class="w-full" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keywords Used</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="kw in availableKeywords"
                :key="kw"
                type="button"
                class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                :class="editForm.keywords.includes(kw)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'"
                @click="toggleEditKeyword(kw)"
              >
                {{ kw }}
              </button>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <div class="flex gap-3">
              <button
                v-for="s in ['active', 'inactive']"
                :key="s"
                type="button"
                class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                :class="editForm.status === s
                  ? s === 'active'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-400 border-gray-400 text-white'
                  : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'"
                @click="editForm.status = s as 'active' | 'inactive'"
              >
                {{ s }}
              </button>
            </div>
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" label="Cancel" @click="isCaregiverModalOpen = false" />
          <UButton color="primary" label="Save" @click="submitCaregiver" />
          <UButton color="neutral" variant="outline" label="Cancel" @click="cancelEdit" />
          <UButton
            color="primary"
            label="Save Changes"
            :disabled="!editForm || !editForm.name.trim() || !editForm.phone.trim() || !editForm.email.trim()"
            @click="saveEdit"
          />
        </div>
      </template>
    </UModal>

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
              v-for="caregiver in filteredCaregivers"
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
                  <UButton
                    variant="link"
                    color="success"
                    icon="i-heroicons-pencil-square-20-solid"
                    label="Edit"
                    @click="openEditCaregiver(caregiver)"
                  />
                  <UButton
                    variant="link"
                    color="error"
                    icon="i-heroicons-trash-20-solid"
                    label="Delete"
                    @click="deleteCaregiver(caregiver)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    <!-- Add Caregiver Modal -->
    <UModal v-model:open="showAddModal" title="Add Caregiver" :ui="{ content: 'sm:max-w-xl' }">
      <template #body>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-200">

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput v-model="form.name" placeholder="e.g. Sarah Johnson" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span class="text-red-500">*</span>
            </label>
            <UInput v-model="form.phone" placeholder="(555) 123-4567" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <UInput v-model="form.email" type="email" placeholder="name@email.com" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <UInput v-model="form.address" placeholder="123 Main St" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / State</label>
            <UInput v-model="form.cityState" placeholder="Boston, MA" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Contact</label>
            <UInput v-model="form.firstContact" type="date" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Interaction</label>
            <UInput v-model="form.lastInteraction" type="date" class="w-full" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keywords Used</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="kw in availableKeywords"
                :key="kw"
                type="button"
                class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                :class="form.keywords.includes(kw)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'"
                @click="toggleKeyword(kw)"
              >
                {{ kw }}
              </button>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <div class="flex gap-3">
              <button
                v-for="s in ['active', 'inactive']"
                :key="s"
                type="button"
                class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                :class="form.status === s
                  ? s === 'active'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-400 border-gray-400 text-white'
                  : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'"
                @click="form.status = s as 'active' | 'inactive'"
              >
                {{ s }}
              </button>
            </div>
          </div>

        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="cancelAdd" />
          <UButton
            color="primary"
            label="Save"
            :disabled="!form.name.trim() || !form.phone.trim() || !form.email.trim()"
            @click="saveCaregiver"
          />
        </div>
      </template>
    </UModal>

    <!-- Table Card -->
    <UCard class="w-full bg-white border-2 border-black rounded-xl p-2 dark:bg-[#134e4a] dark:border-white">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Caregiver Directory</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ filteredData.length }} total caregivers
            </p>
          </div>
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search caregivers..."
            size="sm"
            class="w-56"
          />
        </div>
      </template>

      <UTable :data="filteredData" :columns="columns" />
    </UCard>
  </UContainer>

</template>
