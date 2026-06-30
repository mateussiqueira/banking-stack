// Simple analytics — tracks page views, scroll depth, time on page, quiz completions
// Data stored in localStorage. Integrates with Vercel Analytics via window.va

export function initAnalytics() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  const start = Date.now()

  // Page view
  if ((window as any).va) {
    (window as any).va('event', 'page_view', { path })
  }

  // Scroll depth tracking
  let maxScroll = 0
  window.addEventListener('scroll', () => {
    const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
    if (pct > maxScroll) {
      maxScroll = pct
      if (pct === 25 || pct === 50 || pct === 75 || pct === 100) {
        if ((window as any).va) {
          (window as any).va('event', 'scroll_depth', { path, depth: pct })
        }
      }
    }
  }, { passive: true })

  // Time on page
  window.addEventListener('beforeunload', () => {
    const duration = Math.round((Date.now() - start) / 1000)
    try {
      const key = 'bc_analytics:' + new Date().toISOString().slice(0, 10)
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data[path] = (data[path] || 0) + duration
      localStorage.setItem(key, JSON.stringify(data))
    } catch {}
  })

  // Track quizzes
  const origQuizFn = (window as any).__bc_recordQuiz
  ;(window as any).__bc_recordQuiz = (score: number) => {
    if (origQuizFn) origQuizFn(score)
    if ((window as any).va) {
      (window as any).va('event', 'quiz_complete', { path, score })
    }
  }
}
