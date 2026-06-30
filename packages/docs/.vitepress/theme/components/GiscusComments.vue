<template>
  <div v-if="ready" class="giscus-container" ref="container" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const container = ref<HTMLDivElement>()
const ready = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'mateussiqueira/banking-stack')
  script.setAttribute('data-repo-id', 'R_kgDONwHSUA')
  script.setAttribute('data-category', 'Comments')
  script.setAttribute('data-category-id', 'DIC_kwDONwHSUc4CmzWj')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.setAttribute('data-lang', 'pt')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true

  container.value?.appendChild(script)
  ready.value = true
})
</script>
