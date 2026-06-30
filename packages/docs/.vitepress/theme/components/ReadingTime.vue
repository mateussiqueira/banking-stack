<template>
  <span v-if="minutes" class="reading-time" :title="title">
    ⏱️ {{ minutes }} min de leitura
  </span>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const minutes = ref(0)
const title = ref('')

const WPM = 200

onMounted(() => {
  const content = document.querySelector('.vp-doc')
  if (!content) return

  const text = content.textContent || ''
  const words = text.trim().split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / WPM))

  minutes.value = mins
  title.value = `~${words.toLocaleString()} palavras`
})
</script>
