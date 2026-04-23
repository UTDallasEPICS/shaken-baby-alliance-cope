<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { authClient } from '~/utils/auth-client'

const session = authClient.useSession()
const user = computed(() => (session as any).value?.data?.user ?? (session as any).data?.user)

const initials = computed(() => {
  const name = (user.value?.name ?? '').trim()
  if (!name) return 'AD'
  const parts = name.split(/\s+/).filter((p: string) => p.length > 0)
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const displayName = computed(() => user.value?.name ?? 'Admin User')
const displayRole = computed(() => {
  const role = user.value?.role ?? 'Administrator'
  return String(role).charAt(0).toUpperCase() + String(role).slice(1)
})

const globalSearch = ref('')
const dropdownOpen = ref(false)
const dropdownContainer = ref<HTMLElement | null>(null)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
  dropdownOpen.value = false
}

function handleOutsideClick(event: MouseEvent) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

async function logout() {
  closeDropdown()
  await authClient.signOut()
  await navigateTo('/login')
}

function goToProfile() {
  closeDropdown()
  navigateTo('/profile')
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-search-shell">
      <div class="topbar-search">
        <UIcon name="i-heroicons-magnifying-glass-20-solid" class="topbar-search-icon" />
        <input
          v-model="globalSearch"
          placeholder="Search keywords, messages, caregivers..."
          class="topbar-search-input"
        >
      </div>
    </div>

    <div class="topbar-actions">
      <button class="bell-button" type="button" aria-label="Notifications">
        <UIcon name="i-heroicons-bell-20-solid" class="bell-icon" />
        <span class="bell-dot"></span>
      </button>

      <div ref="dropdownContainer" class="profile-shell">
        <button class="profile-button" type="button" @click="toggleDropdown">
          <div class="profile-avatar">{{ initials }}</div>
          <div class="profile-copy">
            <p>{{ displayName }}</p>
            <span>{{ displayRole }}</span>
          </div>
          <UIcon name="i-heroicons-chevron-down-20-solid" class="profile-chevron" />
        </button>

        <Transition name="drop">
          <div v-if="dropdownOpen" class="profile-menu">
            <div class="profile-menu-heading">My Account</div>
            <button class="profile-menu-item" @click="goToProfile">
              <UIcon name="i-heroicons-user-circle-20-solid" class="menu-icon" />
              Profile Settings
            </button>
            <button class="profile-menu-item danger" @click="logout">
              <UIcon name="i-heroicons-arrow-right-on-rectangle-20-solid" class="menu-icon" />
              Logout
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 76px;
  padding: 14px 30px;
  border-bottom: 1px solid #dfe7f0;
  background: #ffffff;
}

.topbar-search-shell {
  flex: 1;
  max-width: 820px;
}

.topbar-search {
  position: relative;
  display: flex;
  align-items: center;
  height: 50px;
  border: 1px solid #d6e0eb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.topbar-search-icon {
  position: absolute;
  left: 18px;
  width: 20px;
  height: 20px;
  color: #7e90a6;
}

.topbar-search-input {
  width: 100%;
  height: 100%;
  padding: 0 18px 0 52px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  outline: 0;
  color: #102a43;
  font-size: 16px;
}

.topbar-search-input::placeholder {
  color: #7e90a6;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.bell-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #102a43;
}

.bell-icon {
  width: 20px;
  height: 20px;
}

.bell-dot {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 10px;
  height: 10px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #ef4444;
}

.profile-shell {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  padding: 0 14px;
  border: 0;
  background: transparent;
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: linear-gradient(145deg, #23a39c, #1c8f87);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.profile-copy p {
  margin: 0;
  color: #102a43;
  font-size: 16px;
  line-height: 1.1;
  font-weight: 600;
  text-align: left;
}

.profile-copy span {
  display: block;
  margin-top: 4px;
  color: #6b7c93;
  font-size: 13px;
  line-height: 1.1;
  text-align: left;
}

.profile-chevron {
  width: 16px;
  height: 16px;
  color: #6b7c93;
}

.profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  min-width: 220px;
  overflow: hidden;
  border: 1px solid #dfe7f0;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
}

.profile-menu-heading {
  padding: 14px 16px 10px;
  color: #90a1b5;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: 0;
  background: #ffffff;
  color: #334155;
  font-size: 14px;
  text-align: left;
}

.profile-menu-item:hover {
  background: #f8fbff;
}

.profile-menu-item.danger {
  color: #dc2626;
}

.menu-icon {
  width: 16px;
  height: 16px;
}

.drop-enter-active {
  transition: all 0.15s ease;
}

.drop-leave-active {
  transition: all 0.1s ease;
}

.drop-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 900px) {
  .topbar {
    padding: 12px 18px;
  }

  .topbar-search-shell {
    max-width: none;
  }

  .profile-copy {
    display: none;
  }
}
</style>
