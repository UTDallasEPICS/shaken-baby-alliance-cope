<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Dashboard',            to: '/dashboard',    icon: 'i-heroicons-squares-2x2-20-solid' },
  { label: 'Keywords & Auto Reply', to: '/keywords',     icon: 'i-heroicons-key-20-solid' },
  { label: 'Workflow Builder',      to: '/workflows',        icon: 'i-heroicons-arrow-path-20-solid' },
  { label: 'AI Knowledge Base',     to: '/ai-knowledge',     icon: 'i-heroicons-sparkles-20-solid' },
  { label: 'Caregivers',            to: '/caregivers',       icon: 'i-heroicons-user-group-20-solid' },
  { label: 'SMS Conversations',     to: '/messages',     icon: 'i-heroicons-chat-bubble-left-right-20-solid' },
  { label: 'Message Logs',          to: '/message-logs', icon: 'i-heroicons-document-text-20-solid' },
  { label: 'User Management',       to: '/users',        icon: 'i-heroicons-shield-check-20-solid' },
  { label: 'Settings',              to: '/settings',     icon: 'i-heroicons-cog-6-tooth-20-solid' },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <aside class="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0" style="width:280px;background:#ffffff;box-shadow:1px 0 0 #f1f5f9;">
    <div class="flex items-center gap-3 px-6" style="height:84px;">
      <NuxtLink to="/dashboard" class="flex items-center gap-3 no-underline">
        <div class="flex items-center justify-center rounded-2xl" style="width:48px;height:48px;background:var(--brand);color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.8px;">SBA</div>
        <div>
          <div class="text-sm font-bold" style="color:var(--text-primary);">COPE System</div>
          <div class="text-xs" style="color:#64748b;">Admin Dashboard</div>
        </div>
      </NuxtLink>
    </div>

    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 transition duration-200 text-sm"
        :class="isActive(item.to)
          ? 'bg-[#0f766e] text-white font-semibold shadow-sm'
          : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#102a43]'"
      >
        <UIcon
          :name="item.icon"
          style="width:18px;height:18px;flex-shrink:0;transition:color 0.18s ease;"
          :class="isActive(item.to) ? 'text-white' : 'text-[#64748b]'"
        />
        <span class="leading-tight">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="px-4 pb-6">
      <div class="rounded-2xl p-4" style="background:#f0fdf8;border:1px solid #bbf7e0;">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1" style="color:#0f766e;">Need Help?</p>
        <a href="mailto:support@cope.org" class="text-sm font-semibold no-underline" style="color:#0f3b25;">Contact Support</a>
      </div>
      <p class="mt-4 text-[11px] text-center" style="color:#94a3b8;">© 2026 Shaken Baby Alliance</p>
    </div>
  </aside>
</template>
