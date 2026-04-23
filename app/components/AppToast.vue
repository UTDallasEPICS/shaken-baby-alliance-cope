<script setup lang="ts">
const { toasts, dismiss } = useAppToast()

const icons: Record<string, string> = {
  success: 'i-heroicons-check-circle-20-solid',
  error: 'i-heroicons-x-circle-20-solid',
  warning: 'i-heroicons-exclamation-triangle-20-solid',
  info: 'i-heroicons-information-circle-20-solid'
}

const colors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#d97706', text: '#b45309' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1d4ed8' }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5" style="min-width: 300px; max-width: 380px;">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border"
          :style="`background:${colors[toast.type].bg};border-color:${colors[toast.type].border};`"
        >
          <UIcon
            :name="icons[toast.type]"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :style="`color:${colors[toast.type].icon};`"
          />
          <p class="text-sm font-medium flex-1" :style="`color:${colors[toast.type].text};`">
            {{ toast.message }}
          </p>
          <button
            class="flex-shrink-0 rounded-lg p-0.5 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer"
            @click="dismiss(toast.id)"
          >
            <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4" :style="`color:${colors[toast.type].icon};`" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(40px); }
.toast-leave-to     { opacity: 0; transform: translateX(40px); }
</style>
