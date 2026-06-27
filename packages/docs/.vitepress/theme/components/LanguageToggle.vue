<script setup>
import { ref, onMounted, nextTick } from 'vue'

const activeLang = ref('ts')

function switchLang(lang) {
  activeLang.value = lang
  nextTick(() => {
    document.querySelectorAll('.lang-content').forEach(el => {
      el.style.display = 'none'
    })
    document.querySelectorAll(`.lang-content.${lang}`).forEach(el => {
      el.style.display = 'block'
    })
  })
}

onMounted(() => {
  document.querySelectorAll('.lang-content').forEach(el => {
    el.style.display = 'none'
  })
  const tsContent = document.querySelectorAll('.lang-content.ts')
  tsContent.forEach(el => { el.style.display = 'block' })
})
</script>

<template>
  <div class="switch-container">
    <button
      :class="['switch-btn', { active: activeLang === 'ts' }]"
      @click="switchLang('ts')"
    >
      TypeScript
    </button>
    <button
      :class="['switch-btn', { active: activeLang === 'go' }]"
      @click="switchLang('go')"
    >
      Go
    </button>
  </div>
</template>
