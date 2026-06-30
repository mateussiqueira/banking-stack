<template>
  <div v-if="steps.length > 0" class="interactive-diagram">
    <div class="id-header">
      <h3>{{ title }}</h3>
      <span class="id-step-count">Passo {{ currentStep + 1 }} de {{ steps.length }}</span>
    </div>

    <div class="id-controls">
      <button @click="prev" :disabled="currentStep === 0" class="id-btn">Anterior</button>
      <div class="id-progress">
        <div class="id-progress-bar"><div class="id-progress-fill" :style="{ width: percent + '%' }" /></div>
      </div>
      <button @click="next" :disabled="currentStep >= steps.length - 1" class="id-btn primary">
        {{ currentStep >= steps.length - 1 ? 'Concluido' : 'Proximo' }}
      </button>
    </div>

    <div class="id-steps">
      <TransitionGroup name="step">
        <div v-for="(step, i) in steps.slice(0, currentStep + 1)" :key="i" class="id-step" :class="{ active: i === currentStep }">
          <div class="id-step-visual">
            <span class="id-from">{{ step.from }}</span>
            <span class="id-arrow">→</span>
            <span class="id-to">{{ step.to }}</span>
          </div>
          <div class="id-step-content">
            <p class="id-message">{{ step.message }}</p>
            <p v-if="step.explanation" class="id-explanation">{{ step.explanation }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="showFullDiagram" class="id-full">
      <button @click="showFullDiagram = false" class="id-close-full">Fechar diagrama completo</button>
      <slot />
    </div>

    <button v-if="!showFullDiagram" @click="showFullDiagram = true" class="id-show-full">
      Ver diagrama completo
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Step {
  from: string
  to: string
  message: string
  explanation?: string
}

const props = defineProps<{
  title: string
  steps: Step[]
}>()

const currentStep = ref(0)
const showFullDiagram = ref(false)

const percent = computed(() => ((currentStep.value + 1) / props.steps.length) * 100)

function next() {
  if (currentStep.value < props.steps.length - 1) currentStep.value++
}

function prev() {
  if (currentStep.value > 0) currentStep.value--
}
</script>
