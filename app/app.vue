<script setup lang="ts">
const colorMode = useColorMode()

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
  <UApp>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <UContainer class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <span class="font-bold text-2xl">The Shaken Baby Alliance</span>
          </div>

          <div class="[&_input::placeholder]:text-grey-300">
            <UInput v-model="search" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" size="lg" class="w-96" :ui="{ base: '!bg-gray-200 !border-2 !border-black'  }" />
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
      <main>
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>