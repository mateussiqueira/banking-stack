<template>
  <div v-if="state" class="sidebar-progress">
    <div class="sp-level">
      <span class="sp-level-num">{{ state.level }}</span>
      <span class="sp-level-title">{{ levelTitle }}</span>
    </div>
    <div class="sp-xp-bar">
      <div class="sp-xp-fill" :style="{ width: xpPercent + '%' }" />
    </div>
    <div class="sp-xp-text">{{ state.xp }} XP / {{ nextLevelXP }} XP</div>
    <div class="sp-stats">
      <span>{{ state.completedChallenges.length }}/{{ totalChallenges }} desafios</span>
      <span v-if="state.streak > 1">{{ state.streak }} dias</span>
    </div>
    <div v-if="nextChallenge" class="sp-next">
      <span class="sp-next-label">Sugestao</span>
      <a :href="'/challenges/' + nextChallenge">{{ nextLabel }}</a>
    </div>
    <div class="sp-goal" v-if="weeklyGoal">
      <div class="sp-goal-bar">
        <div class="sp-goal-fill" :style="{ width: goalPercent + '%' }" />
      </div>
      <span class="sp-goal-text">{{ completedThisWeek }}/{{ weeklyGoal }} esta semana</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { loadState, getLevel, xpForNextLevel, getLevelTitle, CHALLENGES, LEARNING_PATHS } from '../data/gamification'

const state = ref(loadState())
const totalChallenges = CHALLENGES.length
const weeklyGoal = ref(3)

const nextLevelXP = computed(() => xpForNextLevel(state.value.level))
const xpPercent = computed(() => {
  const prev = xpForNextLevel(state.value.level - 1)
  const next = xpForNextLevel(state.value.level)
  return Math.min(100, ((state.value.xp - prev) / (next - prev)) * 100)
})
const levelTitle = computed(() => getLevelTitle(state.value.level))

const nextChallenge = computed(() => {
  for (const path of LEARNING_PATHS) {
    const missing = path.challenges.find(c => !state.value.completedChallenges.includes(c))
    if (missing) return missing
  }
  return null
})

const nextLabel = computed(() => {
  const c = nextChallenge.value
  if (!c) return ''
  for (const path of LEARNING_PATHS) {
    if (path.challenges.includes(c)) return path.title + ' — proximo desafio'
  }
  return 'Proximo desafio'
})

const completedThisWeek = computed(() => {
  return state.value.completedChallenges.length
})

const goalPercent = computed(() => {
  return Math.min(100, (completedThisWeek.value / weeklyGoal.value) * 100)
})

onMounted(() => {
  const interval = setInterval(() => {
    state.value = loadState()
  }, 5000)
  return () => clearInterval(interval)
})
</script>
