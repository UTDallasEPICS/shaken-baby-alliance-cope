<script setup lang="ts">
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
  <div class="max-w-[1400px] mx-auto p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">User Management</h1>
        <p class="mt-2 text-base text-[#64748b]">Manage system administrators and their permissions</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus-20-solid" label="Create User" />
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      <div class="px-7 py-5 border-b border-[#f1f5f9]">
        <div class="flex h-11 items-center gap-3 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 max-w-sm">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:18px;height:18px;color:#94a3b8;" />
          <input placeholder="Search users by name or username..." class="w-full bg-transparent text-sm outline-none text-[#102a43]" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Name</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Username</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Role</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Status</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Last Login</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-6 py-4 font-medium text-[#102a43]">{{ user.name }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ user.email.split('@')[0] }}</td>
              <td class="px-6 py-4">
                <UBadge :label="user.role" :color="roleColor(user.role)" variant="solid" />
              </td>
              <td class="px-6 py-4">
                <UBadge :label="user.status" :color="user.status === 'Active' ? 'success' : 'neutral'" variant="solid" />
              </td>
              <td class="px-6 py-4 text-[#64748b]">{{ user.lastLogin }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <UButton variant="ghost" color="neutral" icon="i-heroicons-pencil-square-20-solid" size="xs" />
                  <UButton variant="ghost" color="error" icon="i-heroicons-trash-20-solid" size="xs" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>