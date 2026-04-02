<script setup lang="js">
import { ref } from 'vue'

const message = ref('Hello Vue!')

function changeMessage() {
  message.value = 'You clicked the button!'
}

// integrate log in and validation logic here
</script>

<!-- this is for how the log in page will actually look-->
<template>

  <div class="card">
   
  </div>
</template>

<style scoped>

.card {
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
}
</style>