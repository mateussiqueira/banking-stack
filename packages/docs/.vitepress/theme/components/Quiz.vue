<template>
  <div v-if="quiz" class="quiz-container">
    <h3>Teste seu conhecimento</h3>
    <p class="quiz-subtitle">5 questões sobre o que você aprendeu</p>

    <div v-if="!started" class="quiz-start">
      <button @click="startQuiz" class="quiz-btn primary">Começar Quiz</button>
    </div>

    <div v-else-if="!finished" class="quiz-active">
      <div class="quiz-progress">
        Questão {{ current + 1 }} de {{ quiz.questions.length }}
        <span v-if="store?.answeredCount" class="quiz-answered">
          · {{ store.answeredCount }} já respondidas
        </span>
      </div>

      <div class="quiz-question">
        <p>{{ quiz.questions[current].question }}</p>
      </div>

      <div class="quiz-options">
        <button
          v-for="(opt, i) in quiz.questions[current].options"
          :key="i"
          :class="optionClass(i)"
          :disabled="selected !== null"
          @click="selectAnswer(i)"
        >
          <span class="opt-label">{{ opt.label }}</span>
          {{ opt.text }}
        </button>
      </div>

      <div v-if="selected !== null" class="quiz-feedback">
        <div :class="isCorrect ? 'feedback-correct' : 'feedback-incorrect'">
          <strong>{{ isCorrect ? 'Correto' : 'Incorreto' }}</strong>
          <p>{{ quiz.questions[current].explanation }}</p>
        </div>

        <button
          v-if="current + 1 < quiz.questions.length"
          @click="nextQuestion"
          class="quiz-btn primary"
        >
          Próxima Questão →
        </button>
        <button v-else @click="finishQuiz" class="quiz-btn primary">
          Ver Resultado Final
        </button>
      </div>
    </div>

    <div v-else class="quiz-results">
      <div class="quiz-score">
        <span class="score-number">{{ score }}/{{ quiz.questions.length }}</span>
        <span class="score-label">{{ scoreLabel }}</span>
      </div>

      <div v-for="(q, i) in quiz.questions" :key="i" class="quiz-review">
        <div class="review-status">
          {{ store?.answers[i] === q.correct ? '✅' : '❌' }}
        </div>
        <div class="review-content">
          <strong>{{ q.question }}</strong>
          <p class="review-correct">
            Resposta correta: {{ q.options[q.correct].label }}) {{ q.options[q.correct].text }}
          </p>
        </div>
      </div>

      <button @click="resetQuiz" class="quiz-btn secondary">
        Tentar Novamente
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vitepress'
import { quizzes, type ChallengeQuiz } from '../data/quizzes'

interface QuizStore {
  slug: string
  answers: (number | null)[]
  answeredCount: number
}

const route = useRoute()
const quiz = ref<ChallengeQuiz | null>(null)
const current = ref(0)
const selected = ref<number | null>(null)
const started = ref(false)
const finished = ref(false)
const store = ref<QuizStore | null>(null)

const score = computed(() => {
  if (!store.value) return 0
  return store.value.answers.filter((a, i) => a === quiz.value?.questions[i]?.correct).length
})

const scoreLabel = computed(() => {
  const s = score.value
  const total = quiz.value?.questions.length || 5
  if (s === total) return 'Perfeito!'
  if (s >= total - 1) return 'Excelente!'
  if (s >= total - 2) return 'Muito bom!'
  if (s >= total - 3) return 'Continue estudando'
  return 'Revisite o conteudo'
})

const isCorrect = computed(() => {
  if (selected.value === null) return false
  return selected.value === quiz.value?.questions[current.value]?.correct
})

onMounted(() => {
  const path = route.path.replace(/^\/en\//, '/').replace(/^\//, '')
  const slug = path.split('/').pop()?.replace('.html', '') || ''
  const match = quizzes.find(q => path.includes(q.slug) || slug === q.slug)
  if (match) {
    quiz.value = match
    loadStore()
  }
})

function loadStore() {
  try {
    const raw = localStorage.getItem('bc_quiz:' + quiz.value!.slug)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.answers?.length === quiz.value!.questions.length) {
        store.value = parsed
      }
    }
  } catch {}
  if (!store.value) {
    store.value = {
      slug: quiz.value!.slug,
      answers: new Array(quiz.value!.questions.length).fill(null),
      answeredCount: 0,
    }
  }
}

function saveStore() {
  try { localStorage.setItem('bc_quiz:' + quiz.value!.slug, JSON.stringify(store.value)) } catch {}
}

function startQuiz() {
  started.value = true
}

function selectAnswer(i: number) {
  if (selected.value !== null) return
  selected.value = i
  if (store.value) {
    store.value.answers[current.value] = i
    store.value.answeredCount = store.value.answers.filter(a => a !== null).length
    saveStore()
  }
}

function nextQuestion() {
  current.value++
  selected.value = null
}

function finishQuiz() {
  finished.value = true
}

function resetQuiz() {
  current.value = 0
  selected.value = null
  started.value = false
  finished.value = false
  if (store.value) {
    store.value.answers = new Array(quiz.value!.questions.length).fill(null)
    store.value.answeredCount = 0
    saveStore()
  }
}

function optionClass(i: number) {
  if (selected.value === null) return 'quiz-option'
  if (i === quiz.value?.questions[current.value]?.correct) return 'quiz-option correct'
  if (i === selected.value && !isCorrect.value) return 'quiz-option incorrect'
  return 'quiz-option dimmed'
}
</script>
