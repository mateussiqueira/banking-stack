<template>
  <Transition name="toast">
    <div v-if="visible" class="achievement-toast">
      <div class="at-icon">{{ achievement?.icon }}</div>
      <div class="at-text">
        <strong>Conquista desbloqueada!</strong>
        <span>{{ achievement?.title }} — {{ achievement?.description }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadState, recordActivity, checkAchievements, ACHIEVEMENTS, XP_PER_CHALLENGE, addXP, getLevel } from '../data/gamification'

const visible = ref(false)
const achievement = ref<{ icon: string; title: string; description: string } | null>(null)
let queue: string[] = []

function showNext() {
  if (queue.length === 0) { visible.value = false; return }
  const id = queue.shift()!
  const ach = ACHIEVEMENTS.find(a => a.id === id)
  if (ach) {
    achievement.value = { icon: ach.icon, title: ach.title, description: ach.description }
    visible.value = true
    setTimeout(() => { visible.value = false; achievement.value = null; showNext() }, 4000)
  }
}

function onAchievements(newIds: string[]) {
  queue.push(...newIds)
  if (!visible.value) showNext()
}

onMounted(() => {
  const state = loadState()
  recordActivity(state)
  const path = window.location.pathname
  const slug = path.split('/').pop()?.replace('.html', '') || ''

  // Track this page as completed
  if (slug && !state.completedChallenges.includes(slug)) {
    state.completedChallenges.push(slug)
    addXP(state, XP_PER_CHALLENGE)
  }

  // Track reading time
  state.totalReadingMinutes += Math.ceil(estimateWords() / 200)
  const newAch = checkAchievements(state)
  if (newAch.length) onAchievements(newAch)

  // Expose for other components
  ;(window as any).__bc_gamestate = state
  ;(window as any).__bc_addXP = (xp: number) => {
    const s = loadState()
    addXP(s, xp)
    const na = checkAchievements(s)
    if (na.length) onAchievements(na)
  }
  ;(window as any).__bc_recordQuiz = (score: number) => {
    const s = loadState()
    const slug = window.location.pathname.split('/').pop()?.replace('.html', '') || ''
    s.quizScores[slug] = score
    addXP(s, score * 10)
    const na = checkAchievements(s)
    if (na.length) onAchievements(na)
  }
  ;(window as any).__bc_recordBookmark = () => {
    const s = loadState()
    s.bookmarksCount++
    addXP(s, 5)
    const na = checkAchievements(s)
    if (na.length) onAchievements(na)
  }
})

function estimateWords(): number {
  const doc = document.querySelector('.vp-doc')
  return (doc?.textContent?.split(/\s+/).length || 1000)
}
</script>
