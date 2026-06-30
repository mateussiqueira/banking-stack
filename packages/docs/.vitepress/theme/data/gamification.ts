export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition: (state: GameState) => boolean
}

export interface GameState {
  xp: number
  level: number
  streak: number
  lastActiveDate: string
  completedChallenges: string[]
  quizScores: Record<string, number>
  achievements: string[]
  bookmarksCount: number
  totalReadingMinutes: number
}

export const CHALLENGES = [
  '01-ledger', '02-spi', '03-dict', '04-iso8583',
  '05-open-finance', '05-workflow', '06-open-finance', '07-nfse',
  '08-report', '09-leaky-bucket', '10-landing-page', '11-kyc',
  '12-proxmox', '13-cicd', '14-rfc', '15-pisp',
  '16-anticipation', '17-fraud-detection',
]

export const XP_PER_CHALLENGE = 100
export const XP_PER_QUIZ_POINT = 10
export const XP_PER_BOOKMARK = 5
export const XP_PER_DAY_STREAK_BONUS = 25

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

export function xpForNextLevel(level: number): number {
  return (level * level) * 50
}

export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Arquiteto Financeiro'
  if (level >= 30) return 'Engenheiro de Banco Central'
  if (level >= 20) return 'Staff Engineer de Fintech'
  if (level >= 12) return 'Senior Backend Banking'
  if (level >= 7) return 'Mid-level Fintech Dev'
  if (level >= 3) return 'Junior Banking Developer'
  return 'Estagiario de Fintech'
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-challenge',
    title: 'Primeiro Desafio',
    description: 'Completou o primeiro desafio',
    icon: '1',
    condition: (s) => s.completedChallenges.length >= 1,
  },
  {
    id: 'five-challenges',
    title: 'Mao na Massa',
    description: 'Completou 5 desafios',
    icon: '5',
    condition: (s) => s.completedChallenges.length >= 5,
  },
  {
    id: 'ten-challenges',
    title: 'Full Stack Banking',
    description: 'Completou 10 desafios',
    icon: 'T',
    condition: (s) => s.completedChallenges.length >= 10,
  },
  {
    id: 'all-challenges',
    title: 'Banco Central',
    description: 'Completou todos os 17 desafios',
    icon: 'B',
    condition: (s) => s.completedChallenges.length >= CHALLENGES.length,
  },
  {
    id: 'perfect-quiz',
    title: 'Nota 10',
    description: 'Tirou 5/5 em um quiz',
    icon: 'Q',
    condition: (s) => Object.values(s.quizScores).some(v => v === 5),
  },
  {
    id: 'streak-3',
    title: 'Foco',
    description: '3 dias consecutivos de estudo',
    icon: '3',
    condition: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    title: 'Disciplina',
    description: '7 dias consecutivos de estudo',
    icon: '7',
    condition: (s) => s.streak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Inabalavel',
    description: '30 dias consecutivos de estudo',
    icon: 'M',
    condition: (s) => s.streak >= 30,
  },
  {
    id: 'bookmarker',
    title: 'Estudante Dedicado',
    description: 'Salvou 10 bookmarks com notas',
    icon: 'N',
    condition: (s) => s.bookmarksCount >= 10,
  },
  {
    id: 'reader',
    title: 'Leitor Voraz',
    description: 'Acumulou 5 horas de leitura',
    icon: 'R',
    condition: (s) => s.totalReadingMinutes >= 300,
  },
]

export function getInitialState(): GameState {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    completedChallenges: [],
    quizScores: {},
    achievements: [],
    bookmarksCount: 0,
    totalReadingMinutes: 0,
  }
}

const STORAGE_KEY = 'bc_gamestate'

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...getInitialState(), ...JSON.parse(raw) }
  } catch {}
  return getInitialState()
}

export function saveState(state: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

export function addXP(state: GameState, amount: number): { state: GameState; leveledUp: boolean } {
  state.xp += amount
  const newLevel = getLevel(state.xp)
  const leveledUp = newLevel > state.level
  state.level = newLevel
  saveState(state)
  return { state, leveledUp }
}

export function recordActivity(state: GameState): GameState {
  const today = new Date().toISOString().slice(0, 10)
  if (state.lastActiveDate === today) return state

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (state.lastActiveDate === yesterday) {
    state.streak++
  } else {
    state.streak = 1
  }

  state.lastActiveDate = today

  if (state.streak > 0 && state.streak % 3 === 0) {
    addXP(state, XP_PER_DAY_STREAK_BONUS * state.streak)
  }

  saveState(state)
  return state
}

export function checkAchievements(state: GameState): string[] {
  const newAchievements: string[] = []
  for (const ach of ACHIEVEMENTS) {
    if (!state.achievements.includes(ach.id) && ach.condition(state)) {
      state.achievements.push(ach.id)
      newAchievements.push(ach.id)
    }
  }
  if (newAchievements.length) saveState(state)
  return newAchievements
}

export const LEARNING_PATHS = [
  {
    id: 'core-banking',
    title: 'Core Banking',
    description: 'O coracao do sistema financeiro',
    challenges: ['01-ledger', '02-spi', '03-dict', '04-iso8583'],
    color: '#3b82f6',
  },
  {
    id: 'open-finance',
    title: 'Open Finance',
    description: 'Ecossistema de APIs financeiras',
    challenges: ['05-open-finance', '05-workflow', '06-open-finance', '15-pisp'],
    color: '#10b981',
  },
  {
    id: 'operations',
    title: 'Operacoes',
    description: 'Infra, relatorios e compliance',
    challenges: ['07-nfse', '08-report', '11-kyc', '17-fraud-detection'],
    color: '#f59e0b',
  },
  {
    id: 'platform',
    title: 'Plataforma',
    description: 'DevOps, infra e engenharia',
    challenges: ['09-leaky-bucket', '10-landing-page', '12-proxmox', '13-cicd'],
    color: '#8b5cf6',
  },
  {
    id: 'advanced',
    title: 'Avancado',
    description: 'Credito, risco e governanca',
    challenges: ['14-rfc', '16-anticipation'],
    color: '#ef4444',
  },
]
