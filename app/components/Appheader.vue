<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

const colorMode = useColorMode()
const search = ref('')

const isDark = computed({
  get() { return colorMode.value === 'dark' },
  set() { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' }
})

async function logout() {
  await authClient.signOut()
  await navigateTo('/auth', { external: true })
}
</script>

<template>
  <header class="bg-white/95 dark:bg-gray-900/95 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-50">
    <div class="w-full flex items-center justify-between h-20 px-6">
      <span class="font-bold text-2xl md:text-3xl pl-4 md:pl-4">The Shaken Baby Alliance</span>
      <div class="flex items-center gap-4">
        <UButton
          :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          color="neutral"
          variant="ghost"
          @click="isDark = !isDark"
        />
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-arrow-right-on-rectangle-20-solid"
          label="Logout"
          @click="logout"
        />
      </div>
    </div>
  </header>
</template>