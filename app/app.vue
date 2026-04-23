<script setup lang="ts">
const colorMode = useColorMode()
colorMode.preference = 'light'
colorMode.value = 'light'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
