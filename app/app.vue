<script setup lang="ts">
// Used by the header search input (from spring2026).
const search = ref('')
</script>

<template>
  <UApp>
    <div
      class="min-h-screen flex bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
    >
      <SidebarNav />

      <div class="flex-1 flex flex-col">
        <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <UContainer class="flex items-center justify-between h-16">
            <div class="[&_input::placeholder]:text-grey-300 w-full max-w-xl">
              <UInput
                v-model="search"
                placeholder="Search..."
                icon="i-heroicons-magnifying-glass-20-solid"
                size="lg"
                class="w-full"
                :ui="{ base: '!bg-gray-200 !border-2 !border-black' }"
              />
            </div>

            <div class="flex items-center gap-2">
              <UButton
                icon="i-heroicons-bell-20-solid"
                color="neutral"
                variant="ghost"
                aria-label="Notifications"
              />
              <div class="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                <div class="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">A</div>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Admin</span>
              </div>
            </div>
          </UContainer>
        </header>

        <main class="flex-1">
          <NuxtPage />
        </main>
      </div>
    </div>
  </UApp>
</template>