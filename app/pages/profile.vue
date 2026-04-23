<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

const session = authClient.useSession()
const user = computed(() => (session.value as any)?.data?.user ?? (session as any)?.data?.user)

const initials = computed(() => {
  const name = (user.value?.name ?? '').trim()
  if (!name) return 'AD'
  const parts = name.split(/\s+/).filter((p: string) => p.length > 0)
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

function formatDate(d: string | Date | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-[#102a43]">Profile Settings</h1>
      <p class="mt-2 text-base text-[#64748b]">Your account information</p>
    </div>

    <div class="rounded-[32px] border border-[#e7edf3] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-8">
      <div class="flex items-center gap-5 pb-6 border-b border-[#e7edf3]">
        <div
          class="flex items-center justify-center rounded-full text-white font-bold text-2xl flex-shrink-0"
          style="width: 72px; height: 72px; background: #2D7A4F;"
        >
          {{ initials }}
        </div>
        <div>
          <p class="text-xl font-semibold text-[#102a43]">{{ user?.name ?? '—' }}</p>
          <p class="text-sm text-[#2d7a4f] font-medium capitalize mt-1">{{ user?.role ?? 'user' }}</p>
        </div>
      </div>

      <dl class="mt-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Full Name</dt>
          <dd class="text-sm text-[#102a43]">{{ user?.name ?? '—' }}</dd>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Email</dt>
          <dd class="text-sm text-[#102a43]">{{ user?.email ?? '—' }}</dd>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Username</dt>
          <dd class="text-sm text-[#102a43]">{{ (user as any)?.username ?? '—' }}</dd>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Role</dt>
          <dd>
            <UBadge color="success" variant="soft" size="md" class="capitalize">{{ user?.role ?? 'user' }}</UBadge>
          </dd>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Email Verified</dt>
          <dd>
            <UBadge :color="user?.emailVerified ? 'success' : 'warning'" variant="soft" size="md">
              {{ user?.emailVerified ? 'Verified' : 'Not Verified' }}
            </UBadge>
          </dd>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <dt class="w-44 text-sm font-semibold text-[#64748b]">Member Since</dt>
          <dd class="text-sm text-[#102a43]">{{ formatDate(user?.createdAt) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
