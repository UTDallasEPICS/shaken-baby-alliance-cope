<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import SideBar from '~/components/SidebarNav.vue'

interface CaregiverRow {
  id: number
  name: string
  role: string
  phone: string
  email: string
  patients: string
  status: 'Active' | 'Inactive'
}

const caregivers: CaregiverRow[] = [
  { id: 1, name: 'Dr. Sarah Chen', role: 'Primary Care', phone: '+1 (555) 234-5678', email: 'sarah.chen@cope.com', patients: '12 assigned', status: 'Active' },
  { id: 2, name: 'Nurse Linda Martinez', role: 'Home Care', phone: '+1 (555) 345-6789', email: 'linda.martinez@cope.com', patients: '18 assigned', status: 'Active' },
  { id: 3, name: 'Dr. Michael Torres', role: 'Specialist', phone: '+1 (555) 456-7890', email: 'michael.torres@cope.com', patients: '16 assigned', status: 'Active' },
  { id: 4, name: 'Emma Richardson', role: 'Home Care', phone: '+1 (555) 567-8901', email: 'emma.richardson@cope.com', patients: '8 assigned', status: 'Active' },
  { id: 5, name: 'David Park', role: 'Home Care', phone: '+1 (555) 678-9012', email: 'david.park@cope.com', patients: '0 assigned', status: 'Inactive' },
  { id: 6, name: 'Dr. Jennifer Walsh', role: 'Primary Care', phone: '+1 (555) 789-0123', email: 'jennifer.walsh@cope.com', patients: '10 assigned', status: 'Active' },
]
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