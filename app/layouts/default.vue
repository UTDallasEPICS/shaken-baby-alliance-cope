<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <div
    class="flex h-screen flex-col overflow-hidden"
    :style="isDark ? 'background: #0B1D2E;' : 'background: #F0F4F8;'"
  >
    <Appheader />
    <div class="flex flex-1 overflow-hidden">
      <SidebarNav />
      <main
        class="flex-1 overflow-y-auto p-6"
        :style="isDark ? 'background: #0B1D2E;' : 'background: #F0F4F8;'"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
