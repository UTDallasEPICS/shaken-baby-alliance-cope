<script setup lang="ts">
  import { computed } from 'vue'

  const route = useRoute()

  const navItems = computed(() => [
    { label: 'Dashboard', to: '/dashboard', icon: 'i-heroicons-squares-2x2-20-solid' },
    { label: 'Flows', to: '/flows', icon: 'i-heroicons-arrow-path-20-solid' },
    { label: 'Templates', to: '/templates', icon: 'i-heroicons-document-text-20-solid' },
    { label: 'Emergency', to: '/emergency', icon: 'i-heroicons-exclamation-circle-20-solid' },
    { label: 'Caregivers', to: '/caregivers', icon: 'i-heroicons-user-group-20-solid' },
    { label: 'Users', to: '/users', icon: 'i-heroicons-shield-check-20-solid' },
    {
      label: 'Audit Logs',
      to: '/audit-logs',
      icon: 'i-heroicons-clipboard-document-list-20-solid',
    },
  ])

  function isActive(to: string) {
    return route.path === to || route.path.startsWith(`${to}/`)
  }
</script>

<template>
  <aside
    class="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex dark:border-gray-800 dark:bg-gray-900"
  >
    <div class="flex h-30 items-center border-b border-gray-200 px-5 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-[28px] leading-none font-bold text-gray-900 dark:text-white"
          >COPE SMS Admin</span
        >
      </NuxtLink>
    </div>

    <nav class="flex-1 px-3 py-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'group mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium transition-colors',
          isActive(item.to)
            ? 'bg-[#edf2ff] text-[#2f4ea3]'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
        ]"
      >
        <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
        <span class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
