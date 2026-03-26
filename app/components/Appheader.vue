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
  <header class="bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800 sticky top-0 z-50">
    <UContainer class="flex items-center justify-between h-16">
      <span class="font-bold text-2xl">The Shaken Baby Alliance</span>

      <div class="[&_input::placeholder]:text-gray-400">
        <UInput
          v-model="search"
          placeholder="Search..."
          icon="i-heroicons-magnifying-glass-20-solid"
          size="lg"
          class="w-96"
          :ui="{ base: '!bg-gray-200 !border-2 !border-black' }"
        />
      </div>

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
    </UContainer>
  </header>
</template>