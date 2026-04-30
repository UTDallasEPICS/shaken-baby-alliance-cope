<script setup lang="ts">
interface UserRow {
  id: string
  name: string
  email: string
  username: string
  role: string
  createdAt: string | null
  lastLogin: string | null
}

const { confirm } = useConfirm()
const { show: showToast } = useAppToast()

const users = ref<UserRow[]>([])
const searchQuery = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)

const emptyCreate = () => ({ name: '', email: '', username: '', password: '', role: 'user' })
const createForm = ref(emptyCreate())
const editForm = ref<UserRow | null>(null)

const { data, error: fetchError } = await useFetch<{ users: UserRow[] }>('/api/users')
if (fetchError.value) {
  console.error('Failed to load users', fetchError.value)
} else if (data.value?.users) {
  users.value = data.value.users
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q)
  )
})

function roleColor(role: string) {
  if (role === 'admin') return '#dc2626'
  if (role === 'editor') return '#2563eb'
  return '#64748b'
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Create ────────────────────────────────────────────────────────────────
async function saveCreate() {
  if (!createForm.value.name.trim() || !createForm.value.email.trim() || !createForm.value.password.trim()) return
  try {
    const result = await $fetch<{ user: UserRow }>('/api/users', {
      method: 'POST',
      body: createForm.value,
    })
    if (result?.user) users.value.unshift(result.user)
    showCreateModal.value = false
    createForm.value = emptyCreate()
    showToast('User created successfully', 'success')
  } catch (e: any) {
    showToast(e?.data?.message ?? 'Failed to create user', 'error')
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────
function openEditModal(u: UserRow) {
  editForm.value = { ...u }
  showEditModal.value = true
}

async function saveEdit() {
  if (!editForm.value) return
  try {
    const result = await $fetch<{ user: UserRow }>('/api/users', {
      method: 'PUT',
      body: editForm.value,
    })
    if (result?.user) {
      const idx = users.value.findIndex(u => u.id === result.user.id)
      if (idx !== -1) users.value.splice(idx, 1, { ...users.value[idx], ...result.user })
    }
    showEditModal.value = false
    editForm.value = null
    showToast('User updated successfully', 'success')
  } catch (e: any) {
    showToast(e?.data?.message ?? 'Failed to update user', 'error')
  }
}

function cancelEdit() { showEditModal.value = false; editForm.value = null }

// ── Delete ────────────────────────────────────────────────────────────────
async function confirmDelete(u: UserRow) {
  const ok = await confirm(
    `${u.name} will be permanently deleted. This cannot be undone.`,
    'Delete User?',
    'Yes, Delete',
    true
  )
  if (!ok) return
  try {
    await $fetch('/api/users', { method: 'DELETE', body: { id: u.id } })
    users.value = users.value.filter(x => x.id !== u.id)
    showToast('User deleted', 'error')
  } catch (e: any) {
    showToast(e?.data?.message ?? 'Failed to delete user', 'error')
  }
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">User Management</h1>
        <p class="mt-2 text-base text-[#64748b]">Manage system administrators and their permissions</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-95"
        style="background:#0f766e;"
        @click="showCreateModal = true"
      >
        <UIcon name="i-heroicons-plus-20-solid" style="width:16px;height:16px;" />
        Create User
      </button>
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div class="px-4 sm:px-7 py-4 sm:py-5 border-b border-[#f1f5f9]">
        <div class="flex h-11 items-center gap-3 rounded-2xl border border-[#e7edf3] bg-[#f8fbff] px-4 w-full sm:max-w-sm">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" style="width:18px;height:18px;color:#94a3b8;" />
          <input
            v-model="searchQuery"
            placeholder="Search users by name or email..."
            class="w-full bg-transparent text-sm outline-none text-[#102a43]"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px] text-sm">
          <thead>
            <tr class="bg-[#f8fbff]">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Name</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Email</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Username</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Role</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Last Login</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="py-16 text-center text-sm text-[#64748b]">No users found</td>
            </tr>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="border-t border-[#f1f5f9] hover:bg-[#f8fbff] transition duration-150"
            >
              <td class="px-6 py-4 font-medium text-[#102a43]">{{ u.name }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ u.email }}</td>
              <td class="px-6 py-4 text-[#64748b]">{{ u.username || '—' }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  :style="`background:${roleColor(u.role)}`"
                >{{ roleLabel(u.role) }}</span>
              </td>
              <td class="px-6 py-4 text-[#64748b]">{{ formatDate(u.lastLogin) }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7edf3] bg-[#f0fdf4] text-[#0f766e] hover:bg-[#dcfce7] transition"
                    title="Edit user"
                    @click="openEditModal(u)"
                  >
                    <UIcon name="i-heroicons-pencil-square-20-solid" style="width:13px;height:13px;" />
                  </button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7edf3] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition"
                    title="Delete user"
                    @click="confirmDelete(u)"
                  >
                    <UIcon name="i-heroicons-trash-20-solid" style="width:13px;height:13px;" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Create User Modal ────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="overlay">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);"
          @click.self="showCreateModal = false; createForm = emptyCreate()"
        >
          <Transition name="dialog">
            <div
              v-if="showCreateModal"
              class="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div class="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0fdf4]">
                    <UIcon name="i-heroicons-user-plus-20-solid" style="width:16px;height:16px;color:#0f766e;" />
                  </div>
                  <h3 class="text-base font-bold text-[#102a43]">Create User</h3>
                </div>
                <button class="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition" @click="showCreateModal = false; createForm = emptyCreate()">
                  <UIcon name="i-heroicons-x-mark-20-solid" style="width:16px;height:16px;" />
                </button>
              </div>

              <div class="p-6 grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Full Name <span class="text-red-500">*</span></label>
                  <input v-model="createForm.name" placeholder="e.g. Jane Smith" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Email <span class="text-red-500">*</span></label>
                  <input v-model="createForm.email" type="email" placeholder="user@example.com" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Username</label>
                  <input v-model="createForm.username" placeholder="optional" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Password <span class="text-red-500">*</span></label>
                  <input v-model="createForm.password" type="password" placeholder="••••••••" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Role</label>
                  <div class="flex gap-2">
                    <button
                      v-for="r in ['admin', 'editor', 'user']"
                      :key="r"
                      type="button"
                      class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                      :style="createForm.role === r ? `background:${roleColor(r)};border-color:${roleColor(r)};color:white` : 'background:transparent;border-color:#e7edf3;color:#64748b'"
                      @click="createForm.role = r"
                    >{{ r }}</button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9]">
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] transition"
                  @click="showCreateModal = false; createForm = emptyCreate()"
                >Cancel</button>
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background:#0f766e;"
                  :disabled="!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()"
                  @click="saveCreate"
                >Create User</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit User Modal ──────────────────────────────────────────────── -->
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
              v-if="showEditModal && editForm"
              class="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div class="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0fdf4]">
                    <UIcon name="i-heroicons-pencil-square-20-solid" style="width:16px;height:16px;color:#0f766e;" />
                  </div>
                  <h3 class="text-base font-bold text-[#102a43]">Edit User</h3>
                </div>
                <button class="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition" @click="cancelEdit">
                  <UIcon name="i-heroicons-x-mark-20-solid" style="width:16px;height:16px;" />
                </button>
              </div>

              <div class="p-6 grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Full Name <span class="text-red-500">*</span></label>
                  <input v-model="editForm.name" placeholder="e.g. Jane Smith" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Email <span class="text-red-500">*</span></label>
                  <input v-model="editForm.email" type="email" placeholder="user@example.com" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5">Username</label>
                  <input v-model="editForm.username" placeholder="optional" class="w-full rounded-xl border border-[#e7edf3] bg-[#f8fbff] px-3 py-2 text-sm text-[#102a43] outline-none focus:border-[#0f766e] transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Role</label>
                  <div class="flex gap-2">
                    <button
                      v-for="r in ['admin', 'editor', 'user']"
                      :key="r"
                      type="button"
                      class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize"
                      :style="editForm.role === r ? `background:${roleColor(r)};border-color:${roleColor(r)};color:white` : 'background:transparent;border-color:#e7edf3;color:#64748b'"
                      @click="editForm!.role = r"
                    >{{ r }}</button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9]">
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-[#e7edf3] text-[#475569] hover:bg-[#f1f5f9] transition"
                  @click="cancelEdit"
                >Cancel</button>
                <button
                  class="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background:#0f766e;"
                  :disabled="!editForm.name.trim() || !editForm.email.trim()"
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
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.dialog-enter-active {
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-leave-active {
  transition: all 0.15s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}
</style>
