<script setup lang="ts">
import Appheader from '~/components/Appheader.vue'
import SideBar from '~/components/SidebarNav.vue'
</script>

<template>
  <div class="flex flex-col h-screen">
    <Appheader />
    <div class="flex flex-1 overflow-hidden">
      <SideBar />
      <main class="flex-1 overflow-y-auto">
        <UContainer class="py-8">
          <h1 class="text-3xl font-bold">Workflows</h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Navigation target (placeholder).</p>
        </UContainer>
      </main>
    </div>
  </div>
</template>
