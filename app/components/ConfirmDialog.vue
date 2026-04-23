<script setup lang="ts">
const { state, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="state.open"
        class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);"
        @click.self="cancel"
      >
        <Transition name="dialog">
          <div
            v-if="state.open"
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <!-- Icon -->
            <div class="flex items-center gap-4 mb-4">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                :style="state.danger ? 'background:#fef2f2;' : 'background:#eff6ff;'"
              >
                <UIcon
                  :name="state.danger ? 'i-heroicons-exclamation-triangle-20-solid' : 'i-heroicons-question-mark-circle-20-solid'"
                  class="w-6 h-6"
                  :style="state.danger ? 'color:#dc2626;' : 'color:#2563eb;'"
                />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900">{{ state.title }}</h3>
                <p class="text-sm text-gray-500 mt-0.5">{{ state.message }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 mt-6">
              <button
                class="px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors"
                style="background:#f8fafc;color:#374151;border-color:#e2e8f0;"
                @mouseenter="(e) => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'"
                @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = '#f8fafc'"
                @click="cancel"
              >
                Cancel
              </button>
              <button
                class="px-4 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-colors text-white"
                :style="state.danger ? 'background:#dc2626;' : 'background:#2563eb;'"
                @mouseenter="(e) => (e.currentTarget as HTMLElement).style.filter = 'brightness(0.9)'"
                @mouseleave="(e) => (e.currentTarget as HTMLElement).style.filter = ''"
                @click="accept"
              >
                {{ state.confirmLabel }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.dialog-enter-active { transition: all 0.2s ease; }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.95) translateY(-10px); }
.dialog-leave-to { opacity: 0; transform: scale(0.95); }
</style>
