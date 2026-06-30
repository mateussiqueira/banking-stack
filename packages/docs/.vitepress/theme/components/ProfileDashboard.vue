<template>
  <div class="profile-dashboard">
    <div class="pd-hero">
      <div class="pd-level-badge">{{ state.level }}</div>
      <div>
        <h2>{{ levelTitle }}</h2>
        <p class="pd-xp">{{ state.xp }} XP total</p>
      </div>
    </div>

    <div class="pd-grid">
      <div class="pd-card">
        <h3>Progresso</h3>
        <div class="pd-stat">{{ state.completedChallenges.length }}/{{ totalChallenges }}</div>
        <div class="pd-label">desafios completos</div>
        <div class="pd-bar"><div class="pd-fill" :style="{ width: challengePercent + '%' }" /></div>
      </div>
      <div class="pd-card">
        <h3>Sequencia</h3>
        <div class="pd-stat">{{ state.streak }}</div>
        <div class="pd-label">dias consecutivos</div>
      </div>
      <div class="pd-card">
        <h3>Quizzes</h3>
        <div class="pd-stat">{{ totalQuizScore }}</div>
        <div class="pd-label">pontos acumulados</div>
      </div>
      <div class="pd-card">
        <h3>Conquistas</h3>
        <div class="pd-stat">{{ state.achievements.length }}/{{ totalAchievements }}</div>
        <div class="pd-label">desbloqueadas</div>
      </div>
    </div>

    <div class="pd-section">
      <h3>Conquistas</h3>
      <div class="pd-achievements">
        <div v-for="ach in ACHIEVEMENTS" :key="ach.id" class="pd-ach" :class="{ earned: state.achievements.includes(ach.id) }">
          <span class="pd-ach-icon">{{ ach.icon }}</span>
          <span class="pd-ach-title">{{ ach.title }}</span>
        </div>
      </div>
    </div>

    <div class="pd-section">
      <h3>Trilhas de Aprendizado</h3>
      <div class="pd-paths">
        <div v-for="path in LEARNING_PATHS" :key="path.id" class="pd-path">
          <div class="pd-path-header">
            <span class="pd-path-color" :style="{ background: path.color }" />
            <strong>{{ path.title }}</strong>
            <span class="pd-path-progress">{{ pathProgress(path) }}%</span>
          </div>
          <div class="pd-bar"><div class="pd-fill" :style="{ width: pathProgress(path) + '%', background: path.color }" /></div>
        </div>
      </div>
    </div>

    <div class="pd-section">
      <h3>Desafios</h3>
      <div class="pd-challenges">
        <div v-for="c in CHALLENGES" :key="c" class="pd-challenge" :class="{ done: state.completedChallenges.includes(c) }">
          <span class="pd-ch-icon">{{ state.completedChallenges.includes(c) ? '✓' : '○' }}</span>
          <a :href="'/challenges/' + c">{{ formatName(c) }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { loadState, getLevelTitle, CHALLENGES, ACHIEVEMENTS, LEARNING_PATHS } from '../data/gamification'

const state = ref(loadState())
const totalChallenges = CHALLENGES.length
const totalAchievements = ACHIEVEMENTS.length
const levelTitle = computed(() => getLevelTitle(state.value.level))
const totalQuizScore = computed(() => Object.values(state.value.quizScores).reduce((a, b) => a + b, 0))
const challengePercent = computed(() => (state.value.completedChallenges.length / totalChallenges) * 100)

function pathProgress(path: typeof LEARNING_PATHS[0]) {
  const done = path.challenges.filter(c => state.value.completedChallenges.includes(c)).length
  return Math.round((done / path.challenges.length) * 100)
}

function formatName(slug: string) {
  return slug.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(() => {
  const interval = setInterval(() => { state.value = loadState() }, 3000)
  return () => clearInterval(interval)
})
</script>
