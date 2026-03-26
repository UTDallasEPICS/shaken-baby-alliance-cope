<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const searchQuery = ref('')
const showAddModal = ref(false)

type Caregiver = {
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

const caregivers = ref<Caregiver[]>([
  {
    id: 1,
    name: 'Sarah Johnson',
    phone: '(555) 123-4567',
    email: 'sarah.j@email.com',
    address: '123 Main St',
    cityState: 'Boston, MA',
    firstContact: '1/14/2024',
    lastInteraction: '3/4/2024',
    keywords: ['HELP', 'COPE', 'CALM'],
    status: 'active',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    phone: '(555) 234-5678',
    email: 'maria.g@email.com',
    address: '456 Oak Ave',
    cityState: 'Chicago, IL',
    firstContact: '2/9/2024',
    lastInteraction: '3/5/2024',
    keywords: ['HELP', 'EMERGENCY'],
    status: 'active',
  },
  {
    id: 3,
    name: 'Jennifer Smith',
    phone: '(555) 345-6789',
    email: 'jen.smith@email.com',
    address: '789 Pine Rd',
    cityState: 'Austin, TX',
    firstContact: '12/19/2023',
    lastInteraction: '2/27/2024',
    keywords: ['CALM', 'COPE'],
    status: 'inactive',
  },
  {
    id: 4,
    name: 'Emily Chen',
    phone: '(555) 456-7890',
    email: 'emily.c@email.com',
    address: '321 Elm St',
    cityState: 'Seattle, WA',
    firstContact: '1/27/2024',
    lastInteraction: '3/5/2024',
    keywords: ['HELP'],
    status: 'active',
  },
])

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

function deleteCaregiver(id: number) {
  const idx = caregivers.value.findIndex(c => c.id === id)
  if (idx !== -1) caregivers.value.splice(idx, 1)
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
const availableKeywords = ['HELP', 'COPE', 'CALM', 'EMERGENCY']

function toggleKeyword(kw: string) {
  const idx = form.value.keywords.indexOf(kw)
  if (idx === -1) form.value.keywords.push(kw)
  else form.value.keywords.splice(idx, 1)
}

function saveCaregiver() {
  if (!form.value.name.trim()) return
  caregivers.value.push({ ...form.value, id: Date.now() })
  form.value = emptyForm()
  showAddModal.value = false
}

function cancelAdd() {
  form.value = emptyForm()
  showAddModal.value = false
}

const showEditModal = ref(false)
const editForm = ref<Caregiver | null>(null)

function openEditModal(caregiver: Caregiver) {
  editForm.value = { ...caregiver, keywords: [...caregiver.keywords] }
  showEditModal.value = true
}

function saveEdit() {
  if (!editForm.value) return
  const idx = caregivers.value.findIndex(c => c.id === editForm.value!.id)
  if (idx !== -1) caregivers.value[idx] = { ...editForm.value }
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
        icon="i-heroicons-plus-20-solid"
        label="Add Caregiver"
        color="primary"
        @click="showAddModal = true"
      />
    </div>

    <!-- Add Caregiver Modal -->
    <UModal v-model:open="showAddModal" title="Add Caregiver" :ui="{ width: 'sm:max-w-xl' }">
      <template #body>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span class="text-red-500">*</span>
            </label>
            <UInput v-model="form.name" placeholder="e.g. Sarah Johnson" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <UInput v-model="form.phone" placeholder="(555) 123-4567" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
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
          <UButton color="primary" label="Save" :disabled="!form.name.trim()" @click="saveCaregiver" />
        </div>
      </template>
    </UModal>


    <!-- Table Card -->
    <UCard class="w-full">
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

<!-- Edit Caregiver Modal -->
<UModal v-model:open="showEditModal" title="Edit Caregiver" :ui="{ width: 'sm:max-w-xl' }">
  <template #body>
    <div v-if="editForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name <span class="text-red-500">*</span>
        </label>
        <UInput v-model="editForm.name" placeholder="e.g. Sarah Johnson" class="w-full" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
        <UInput v-model="editForm.phone" placeholder="(555) 123-4567" class="w-full" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
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
      <UButton color="neutral" variant="outline" label="Cancel" @click="cancelEdit" />
      <UButton color="primary" label="Save Changes" :disabled="!editForm?.name.trim()" @click="saveEdit" />
    </div>
  </template>
</UModal>

</template>