<template>
  <div class="leaderboard">
    <div class="lb-header">
      <h2>Sua Posicao</h2>
      <div class="lb-rank">{{ rankLabel }}</div>
    </div>

    <table class="lb-table">
      <thead><tr><th>#</th><th>Nivel</th><th>Titulo</th><th>XP</th><th>Desafios</th><th>Streak</th></tr></thead>
      <tbody>
        <tr class="lb-you" v-if="state">
          <td>{{ rankLabel }}</td>
          <td><strong>{{ state.level }}</strong></td>
          <td>{{ getLevelTitle(state.level) }}</td>
          <td>{{ state.xp }}</td>
          <td>{{ state.completedChallenges.length }}/{{ total }}</td>
          <td>{{ state.streak }} dias</td>
        </tr>
      </tbody>
    </table>

    <div class="lb-metrics">
      <div class="lb-metric">
        <span class="lb-num">{{ state?.achievements?.length || 0 }}</span>
        <span class="lb-label">Conquistas</span>
      </div>
      <div class="lb-metric">
        <span class="lb-num">{{ quizTotal }}</span>
        <span class="lb-label">Quiz Score</span>
      </div>
      <div class="lb-metric">
        <span class="lb-num">{{ state?.totalReadingMinutes || 0 }}m</span>
        <span class="lb-label">Tempo lendo</span>
      </div>
    </div>

    <p class="lb-note">Dados do seu navegador. Para ranking global e certificacao, assine o <a href="/premium">plano Pro</a>.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { loadState, getLevelTitle, CHALLENGES } from '../data/gamification'

const state = ref(loadState())
const total = CHALLENGES.length

const quizTotal = computed(() => {
  if (!state.value) return 0
  return Object.values(state.value.quizScores).reduce((a, b) => a + b, 0)
})

const rankLabel = computed(() => {
  const xp = state.value?.xp || 0
  if (xp >= 5000) return 'Top 1%'
  if (xp >= 2000) return 'Top 5%'
  if (xp >= 1000) return 'Top 10%'
  if (xp >= 500) return 'Top 25%'
  if (xp >= 100) return 'Top 50%'
  return 'Iniciante'
})

onMounted(() => {
  const interval = setInterval(() => { state.value = loadState() }, 3000)
  return () => clearInterval(interval)
})
</script>
