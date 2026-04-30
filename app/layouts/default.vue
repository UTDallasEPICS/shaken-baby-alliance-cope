<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
import AppToast from '~/components/AppToast.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import SidebarNav from '~/components/SidebarNav.vue'

const workflowMaximized = useState('workflow-builder-maximized', () => false)
const workflowCanvasMaximized = useState('workflow-canvas-maximized', () => false)
const route = useRoute()

const isMessagesPage = computed(() => route.path === '/messages')
</script>

<template>
  <div class="flex min-h-screen" style="background: #ffffff !important;">
    <div v-if="!workflowMaximized && !workflowCanvasMaximized" class="sticky top-0 h-screen self-start">
      <SidebarNav />
    </div>

    <div class="flex-1 min-w-0 flex flex-col" style="background: #ffffff !important;">
      <div v-if="!workflowMaximized && !workflowCanvasMaximized" class="sticky top-0 z-30">
        <AppHeader />
      </div>
      <main
        class="flex-1 min-w-0"
        :class="[
          workflowMaximized ? 'p-0' : 'p-3 sm:p-5',
          isMessagesPage ? 'overflow-hidden' : 'overflow-y-auto',
        ]"
        style="background: #ffffff !important;"
      >
        <slot />
      </main>
    </div>
  </div>
  <ClientOnly>
    <AppToast />
    <ConfirmDialog />
  </ClientOnly>
</template>
