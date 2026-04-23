<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function logout() {
  await authClient.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <header
    class="sticky top-0 z-50 flex items-center justify-between"
    style="height: 64px; padding: 0 20px;"
    :style="
      isDark
        ? 'background: #0F2438; border-bottom: 1px solid rgba(255,255,255,0.08);'
        : 'background: #ffffff; border-bottom: 1px solid #e5e7eb;'
    "
  >
    <!-- Left: Brand -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <div
        style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2D7A4F;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        "
      >
        <UIcon
          name="i-heroicons-heart-20-solid"
          style="width: 16px; height: 16px; color: #ffffff;"
        />
      </div>

      <div>
        <span
          style="display: block; font-weight: 700; font-size: 16px; line-height: 1.25;"
          :style="isDark ? 'color: #ffffff;' : 'color: #1B3A5C;'"
        >
          The Shaken Baby Alliance
        </span>
        <span
          style="display: block; font-size: 11px; line-height: 1.25;"
          :style="isDark ? 'color: #3B9E6A;' : 'color: #2D7A4F;'"
        >
          COPE SMS Admin
        </span>
      </div>
    </div>

    <!-- Right: Controls -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <!-- Theme toggle -->
      <button
        style="
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        :style="
          isDark
            ? 'background: rgba(255,255,255,0.08); color: #cbd5e1;'
            : 'background: #F0F4F8; color: #475569;'
        "
        @click="toggleTheme"
      >
        <UIcon
          :name="isDark ? 'i-heroicons-sun-20-solid' : 'i-heroicons-moon-20-solid'"
          style="width: 18px; height: 18px;"
        />
      </button>

      <!-- Logout button -->
      <button
        style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: #C9A227;
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        "
        @mouseenter="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#A67F1A'"
        @mouseleave="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A227'"
        @click="logout"
      >
        <UIcon
          name="i-heroicons-arrow-right-on-rectangle-20-solid"
          style="width: 16px; height: 16px;"
        />
        Logout
      </button>
    </div>
  </header>
</template>
