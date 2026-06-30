<template>
  <div v-if="visible" class="checkpoint-container">
    <div class="checkpoint-header" @click="revealed = !revealed">
      <span>Pausa para compreensao</span>
      <span class="checkpoint-toggle">{{ revealed ? '▲' : '▼' }}</span>
    </div>
    <Transition name="checkpoint">
      <div v-if="revealed" class="checkpoint-body">
        <p class="checkpoint-question">{{ question }}</p>
        <div class="checkpoint-reveal">
          <button v-if="!showAnswer" @click="showAnswer = true" class="quiz-btn primary small">
            Revelar Resposta
          </button>
          <div v-else class="checkpoint-answer">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ question: string }>()
const visible = ref(false)
const revealed = ref(false)
const showAnswer = ref(false)

onMounted(() => {
  visible.value = true
})
</script>
