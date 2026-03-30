<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const navItems = computed(() => [
  { label: 'Dashboard', to: '/', icon: 'i-heroicons-squares-2x2-20-solid' },
  { label: 'Flows', to: '/flows', icon: 'i-heroicons-arrow-path-20-solid' },
  { label: 'Templates', to: '/templates', icon: 'i-heroicons-document-text-20-solid' },
  { label: 'Emergency', to: '/emergency', icon: 'i-heroicons-exclamation-circle-20-solid' },
  { label: 'Caregivers', to: '/caregivers', icon: 'i-heroicons-user-group-20-solid' },
  { label: 'Users', to: '/users', icon: 'i-heroicons-shield-check-20-solid' },
  { label: 'Audit Logs', to: '/audit-logs', icon: 'i-heroicons-clipboard-document-list-20-solid' },
])

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <aside
    class="w-56 hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
  >
    <div class="h-16 px-4 flex items-center border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="font-semibold text-[22px] leading-none text-gray-900 dark:text-white">COPE SMS Admin</span>
      </NuxtLink>
    </div>

    <nav class="px-2 py-3 flex-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors mb-1',
          isActive(item.to)
            ? 'bg-[#edf2ff] text-[#2f4ea3]'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
        ]"
      >
        <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>

