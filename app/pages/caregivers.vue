<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

interface CaregiverRow {
  id: number
  name: string
  role: string
  phone: string
  email: string
  patients: string
  status: 'Active' | 'Inactive'
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
}
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Caregivers</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Manage caregiver profiles and assignments</p>
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
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" label="Cancel" @click="isCaregiverModalOpen = false" />
          <UButton color="primary" label="Save" @click="submitCaregiver" />
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
    </UCard>
  </UContainer>
</template>

