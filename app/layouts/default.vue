<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <Appheader />
    <div class="flex flex-1 overflow-hidden">
      <SidebarNav />
      <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
