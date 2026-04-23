<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import SideBar from '~/components/SidebarNav.vue'

interface UserRow {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
  lastLogin: string
  status: 'Active' | 'Inactive'
}

const users: UserRow[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@cope.com', role: 'Admin', lastLogin: '2024-03-08 10:30 AM', status: 'Active' },
  { id: 2, name: 'Michael Chen', email: 'michael.chen@cope.com', role: 'Admin', lastLogin: '2024-03-06 09:15 AM', status: 'Active' },
  { id: 3, name: 'Emily Davis', email: 'emily.davis@cope.com', role: 'Editor', lastLogin: '2024-03-08 04:45 AM', status: 'Active' },
  { id: 4, name: 'David Martinez', email: 'david.martinez@cope.com', role: 'Editor', lastLogin: '2024-07-08 04:20 PM', status: 'Active' },
  { id: 5, name: 'Jessica Thompson', email: 'jessica.thompson@cope.com', role: 'Viewer', lastLogin: '2024-03-04 02:10 PM', status: 'Active' },
  { id: 6, name: 'Robert Williams', email: 'robert.williams@cope.com', role: 'Viewer', lastLogin: '2024-02-28 11:30 AM', status: 'Inactive' },
]

function roleColor(role: UserRow['role']) {
  if (role === 'Admin') return 'error'
  if (role === 'Editor') return 'primary'
  return 'neutral'
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
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
              <p class="text-sm text-gray-500 dark:text-gray-300">Manage system users and permissions</p>
            </div>
            <UButton color="primary" icon="i-heroicons-plus-20-solid" label="New User" />
          </div>

          <UAlert
            class="border-2 border-black dark:border-white/30 dark:bg-white/5"
            icon="i-heroicons-information-circle-20-solid"
            color="neutral"
            variant="subtle"
            title="Admin: Full system access"
            description="Editor: Can create and modify content • Viewer: Read-only access"
          />

          <UCard class="bg-white! border-2 border-black rounded-xl p-3 dark:bg-[#134e4a]! dark:border-white" :ui="{ body: 'p-0 sm:p-0' }">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[980px] text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-white/20">
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Name</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Email</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Role</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Last Login</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in users"
                    :key="user.id"
                    class="border-b border-gray-100 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ user.name }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ user.email }}</td>
                    <td class="px-4 py-3">
                      <UBadge :label="user.role" :color="roleColor(user.role)" variant="solid" />
                    </td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ user.lastLogin }}</td>
                    <td class="px-4 py-3">
                      <UBadge :label="user.status" :color="user.status === 'Active' ? 'success' : 'neutral'" variant="solid" />
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