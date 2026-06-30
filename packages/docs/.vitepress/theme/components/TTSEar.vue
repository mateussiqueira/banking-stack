<template>
  <button v-if="supported" class="tts-ear" :class="{ playing: isPlaying }" @click="toggle" :title="isPlaying ? 'Parar leitura' : 'Ouvir conteudo'">
    {{ isPlaying ? 'Pausar' : 'Ouvir' }}
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const supported = ref(false)
const isPlaying = ref(false)
let utterance: SpeechSynthesisUtterance | null = null

onMounted(() => {
  supported.value = typeof window !== 'undefined' && 'speechSynthesis' in window
})

function toggle() {
  if (isPlaying.value) {
    speechSynthesis.cancel()
    isPlaying.value = false
    return
  }

  const content = document.querySelector('.vp-doc')
  if (!content) return

  const text = content.textContent || ''
  if (text.length < 100) return

  utterance = new SpeechSynthesisUtterance(text.slice(0, 8000))
  utterance.lang = 'pt-BR'
  utterance.rate = 1.1
  utterance.onend = () => { isPlaying.value = false }
  utterance.onerror = () => { isPlaying.value = false }

  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
  isPlaying.value = true
}
</script>
