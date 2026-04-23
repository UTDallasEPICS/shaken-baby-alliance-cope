<script setup lang="ts">
import { useAppSearch, rowMatchesAppSearch } from '~/composables/useAppSearch'

interface UserRow {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
  lastLogin: string
  status: 'Active' | 'Inactive'
}

const toast = useToast()

const { data: usersData, refresh: refreshUsers } = await useFetch<UserRow[]>('/api/users', {
  default: () => [],
})

const users = computed(() => usersData.value ?? [])

const appSearch = useAppSearch()
const filteredUsers = computed(() =>
  users.value.filter((u) =>
    rowMatchesAppSearch(appSearch.value, u.name, u.email, u.role, u.lastLogin, u.status),
  ),
)

const isUserModalOpen = ref(false)
const userModalMode = ref<'create' | 'edit'>('create')

const userForm = reactive<{
  id: number | null
  name: string
  email: string
  role: UserRow['role']
  lastLogin: string
  status: UserRow['status']
}>({
  id: null,
  name: '',
  email: '',
  role: 'Viewer',
  lastLogin: new Date().toLocaleString(),
  status: 'Active',
})

function openCreateUser() {
  userModalMode.value = 'create'
  userForm.id = null
  userForm.name = ''
  userForm.email = ''
  userForm.role = 'Viewer'
  userForm.lastLogin = new Date().toLocaleString()
  userForm.status = 'Active'
  isUserModalOpen.value = true
}

function openEditUser(u: UserRow) {
  userModalMode.value = 'edit'
  userForm.id = u.id
  userForm.name = u.name
  userForm.email = u.email
  userForm.role = u.role
  userForm.lastLogin = u.lastLogin
  userForm.status = u.status
  isUserModalOpen.value = true
}

async function submitUser() {
  const name = userForm.name.trim()
  const email = userForm.email.trim()
  if (!name || !email) {
    toast.add({ title: 'Name and email are required', color: 'error' })
    return
  }

  const payload = {
    name,
    email,
    role: userForm.role,
    lastLogin: userForm.lastLogin.trim(),
    status: userForm.status,
  }

  if (userModalMode.value === 'create') {
    await $fetch('/api/users', { method: 'POST', body: payload })
    toast.add({ title: 'User created', color: 'success' })
  } else {
    await $fetch(`/api/users/${userForm.id}`, { method: 'PUT', body: payload })
    toast.add({ title: 'User updated', color: 'success' })
  }

  isUserModalOpen.value = false
  await refreshUsers()
}

async function deleteUser(user: UserRow) {
  const ok = confirm(`Delete user "${user.name}"?`)
  if (!ok) return
  await $fetch(`/api/users/${user.id}`, { method: 'DELETE' })
  await refreshUsers()
  toast.add({ title: 'User deleted', color: 'success' })
}

function roleColor(role: UserRow['role']) {
  if (role === 'Admin') return 'error'
  if (role === 'Editor') return 'primary'
  return 'neutral'
}
</script>

<template>
  <UContainer class="py-6 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300">Manage system users and permissions</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus-20-solid" label="New User" @click="openCreateUser" />
    </div>

    <UModal
      v-model:open="isUserModalOpen"
      :title="userModalMode === 'create' ? 'New User' : 'Edit User'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Name">
            <UInput v-model="userForm.name" placeholder="Sarah Johnson" :ui="copeFieldUi" />
          </UFormField>
          <UFormField label="Email">
            <UInput v-model="userForm.email" placeholder="sarah.johnson@cope.com" :ui="copeFieldUi" />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Role">
              <USelect v-model="userForm.role" :items="['Admin', 'Editor', 'Viewer']" :ui="copeFieldUi" />
            </UFormField>
            <UFormField label="Status">
              <USelect v-model="userForm.status" :items="['Active', 'Inactive']" :ui="copeFieldUi" />
            </UFormField>
          </div>

          <UFormField label="Last Login">
            <UInput v-model="userForm.lastLogin" :ui="copeFieldUi" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" label="Cancel" @click="isUserModalOpen = false" />
          <UButton color="primary" label="Save" @click="submitUser" />
        </div>
      </template>
    </UModal>

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
              v-for="user in filteredUsers"
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
                  <UButton
                    variant="link"
                    color="success"
                    icon="i-heroicons-pencil-square-20-solid"
                    label="Edit"
                    @click="openEditUser(user)"
                  />
                  <UButton
                    variant="link"
                    color="error"
                    icon="i-heroicons-trash-20-solid"
                    label="Delete"
                    @click="deleteUser(user)"
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

