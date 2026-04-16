<script setup lang="ts">
const route = useRoute()

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-heroicons-squares-2x2-20-solid' },
    ],
  },
  {
    label: 'MESSAGING',
    items: [
      { label: 'Messages',     to: '/messages',     icon: 'i-heroicons-chat-bubble-left-right-20-solid' },
      { label: 'Message Logs', to: '/message-logs', icon: 'i-heroicons-chat-bubble-bottom-center-text-20-solid' },
      { label: 'Templates',    to: '/templates',    icon: 'i-heroicons-document-text-20-solid' },
    ],
  },
  {
    label: 'AUTOMATION',
    items: [
      { label: 'Keywords',  to: '/keywords',  icon: 'i-heroicons-key-20-solid' },
      { label: 'Workflows', to: '/workflows', icon: 'i-heroicons-arrow-path-20-solid' },
      { label: 'Flows',     to: '/flows',     icon: 'i-heroicons-arrows-right-left-20-solid' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Caregivers',  to: '/caregivers',  icon: 'i-heroicons-user-group-20-solid' },
      { label: 'Emergency',   to: '/emergency',   icon: 'i-heroicons-exclamation-circle-20-solid' },
      { label: 'Users',       to: '/users',       icon: 'i-heroicons-shield-check-20-solid' },
      { label: 'Audit Logs',  to: '/audit-logs',  icon: 'i-heroicons-clipboard-document-list-20-solid' },
    ],
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

function onMouseEnter(e: MouseEvent, to: string) {
  if (isActive(to)) return
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = 'rgba(255,255,255,0.09)'
  el.style.color = '#ffffff'
}

function onMouseLeave(e: MouseEvent, to: string) {
  if (isActive(to)) return
  const el = e.currentTarget as HTMLElement
  el.style.backgroundColor = 'transparent'
  el.style.color = 'rgba(203,213,225,1)'
}
</script>

<template>
  <aside
    class="hidden lg:flex flex-col h-full"
    style="width: 256px; flex-shrink: 0; background: #1B3A5C;"
  >
    <!-- Logo area -->
    <div
      style="
        height: 72px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        flex-shrink: 0;
      "
    >
      <NuxtLink
        to="/dashboard"
        style="display: flex; align-items: center; gap: 10px; text-decoration: none;"
      >
        <div
          style="
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #C9A227;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          "
        >
          <UIcon
            name="i-heroicons-shield-check-20-solid"
            style="width: 20px; height: 20px; color: #ffffff;"
          />
        </div>
        <div>
          <div style="font-weight: 700; font-size: 14px; color: #ffffff; line-height: 1.2;">
            COPE SMS
          </div>
          <div style="font-size: 11px; color: #C9A227; line-height: 1.2;">
            Admin Portal
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav style="flex: 1; overflow-y: auto; padding: 8px 12px;">
      <template v-for="(group, gi) in navGroups" :key="group.label">
        <!-- Section label -->
        <div
          style="
            font-size: 10px;
            letter-spacing: 0.08em;
            color: rgba(255,255,255,0.35);
            text-transform: uppercase;
            padding: 0 12px;
            margin-bottom: 4px;
          "
          :style="gi === 0 ? 'margin-top: 8px;' : 'margin-top: 16px;'"
        >
          {{ group.label }}
        </div>

        <!-- Nav items -->
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 13.5px;
            font-weight: 500;
            text-decoration: none;
            margin-bottom: 2px;
            transition: background-color 0.15s ease, color 0.15s ease;
          "
          :style="
            isActive(item.to)
              ? 'background: #2D7A4F; color: #ffffff;'
              : 'background: transparent; color: rgba(203,213,225,1);'
          "
          @mouseenter="(e) => onMouseEnter(e, item.to)"
          @mouseleave="(e) => onMouseLeave(e, item.to)"
        >
          <UIcon
            :name="item.icon"
            style="width: 18px; height: 18px; flex-shrink: 0;"
          />
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ item.label }}
          </span>
        </NuxtLink>
      </template>
    </nav>

    <!-- Footer -->
    <div
      style="
        padding: 12px 16px;
        border-top: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
      "
    >
      <p style="font-size: 11px; color: rgba(255,255,255,0.3); margin: 0;">
        &copy; 2026 Shaken Baby Alliance
      </p>
    </div>
  </aside>
</template>
