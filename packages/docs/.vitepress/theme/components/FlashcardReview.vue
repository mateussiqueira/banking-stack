<template>
  <div v-if="deck && deck.length > 0" class="flashcard-container">
    <div class="flashcard-header">
      <h3>Revisao Programada</h3>
      <span class="flashcard-stats">{{ dueCount }} de {{ deck.length }} para revisar</span>
    </div>

    <div v-if="currentCard" class="flashcard-card" :class="{ flipped }" @click="flipped = !flipped">
      <div class="flashcard-face front">
        <span class="flashcard-label">Pergunta</span>
        <p>{{ currentCard.front }}</p>
      </div>
      <div class="flashcard-face back" v-if="flipped">
        <span class="flashcard-label">Resposta</span>
        <p>{{ currentCard.back }}</p>

        <div class="flashcard-quality">
          <span>Qual foi sua lembranca?</span>
          <div class="quality-buttons">
            <button v-for="(label, q) in qualityLabels" :key="q" :class="'q-btn q-' + q" @click.stop="rate(q)">
              {{ label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!currentCard && dueCount === 0" class="flashcard-done">
      Nenhum flashcard pendente para revisar hoje. Volte amanha!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FLASHCARD_DECKS, loadCardStates, saveCardStates, sm2Schedule, getDueCards, getInitialCardState, type CardState } from '../data/flashcards'

const qualityLabels = ['Esqueci', 'Dificil', 'Medio', 'Fácil', 'Perfeito']
const flipped = ref(false)
const currentIndex = ref(0)
const states = ref<Record<string, CardState>>({})
const dueCards = ref<ReturnType<typeof getDueCards>>([])

const path = typeof window !== 'undefined' ? window.location.pathname : ''
const slug = path.split('/').pop()?.replace('.html', '') || ''
const deck = computed(() => FLASHCARD_DECKS[slug] || [])
const currentCard = computed(() => dueCards.value[currentIndex.value] || null)
const dueCount = computed(() => dueCards.value.length - currentIndex.value)
const initialized = ref(false)

function init() {
  if (initialized.value) return
  initialized.value = true
  states.value = loadCardStates()

  if (deck.value.length > 0) {
    for (const card of deck.value) {
      if (!states.value[card.id]) states.value[card.id] = getInitialCardState(card.id)
    }
    saveCardStates(states.value)
    dueCards.value = getDueCards(deck.value, states.value)
  }
}

if (typeof window !== 'undefined') {
  init()
  // Expose for reuse
  ;(window as any).__bc_flashcards_due = () => {
    const s = loadCardStates()
    let total = 0
    for (const [slug, deck] of Object.entries(FLASHCARD_DECKS)) {
      total += getDueCards(deck, s).length
    }
    return total
  }
}

function rate(quality: number) {
  if (!currentCard.value) return
  const id = currentCard.value.id
  const oldState = states.value[id] || getInitialCardState(id)
  states.value[id] = sm2Schedule(oldState, quality)
  saveCardStates(states.value)
  flipped.value = false
  currentIndex.value++
}
</script>
