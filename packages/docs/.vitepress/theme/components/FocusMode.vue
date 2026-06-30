<template>
  <button
    class="focus-mode-toggle"
    :class="{ active: isFocusMode }"
    @click="toggle"
    :title="isFocusMode ? 'Sair do modo foco' : 'Modo foco'"
  >
    {{ isFocusMode ? 'F' : 'f' }}
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isFocusMode = ref(false)

const STORAGE_KEY = 'banking-challenges:focus-mode'

function applyMode(active: boolean) {
  document.body.classList.toggle('focus-mode', active)
  try { localStorage.setItem(STORAGE_KEY, String(active)) } catch {}
}

function toggle() {
  isFocusMode.value = !isFocusMode.value
  applyMode(isFocusMode.value)
}

onMounted(() => {
  try {
    isFocusMode.value = localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {}
  applyMode(isFocusMode.value)
})
</script>
