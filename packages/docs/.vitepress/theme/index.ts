import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { onMounted, watch, nextTick } from 'vue'
import LanguageToggle from './components/LanguageToggle.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import ReadingTime from './components/ReadingTime.vue'
import FloatingNav from './components/FloatingNav.vue'
import FocusMode from './components/FocusMode.vue'
import Quiz from './components/Quiz.vue'
import Checkpoint from './components/Checkpoint.vue'
import BookmarksPanel from './components/BookmarksPanel.vue'
import GiscusComments from './components/GiscusComments.vue'
import AchievementToast from './components/AchievementToast.vue'
import SidebarProgress from './components/SidebarProgress.vue'
import FlashcardReview from './components/FlashcardReview.vue'
import ExportNotes from './components/ExportNotes.vue'
import Layout from './Layout.vue'
import './custom.css'

function setupMermaidZoom() {
  if (typeof window === 'undefined') return

  function attachZoom(container: HTMLElement) {
    const svg = container.querySelector('svg')
    if (!svg || container.dataset.zoomAttached) return
    container.dataset.zoomAttached = 'true'

    container.style.cursor = 'zoom-in'

    container.addEventListener('click', () => {
      if (document.querySelector('.mermaid-zoom-overlay')) return

      const overlay = document.createElement('div')
      overlay.className = 'mermaid-zoom-overlay'

      const closeBtn = document.createElement('button')
      closeBtn.className = 'mermaid-zoom-close'
      closeBtn.innerHTML = '&times;'

      const clonedSvg = svg.cloneNode(true) as SVGElement
      clonedSvg.style.maxWidth = '95vw'
      clonedSvg.style.maxHeight = '95vh'
      overlay.appendChild(clonedSvg)
      overlay.appendChild(closeBtn)
      document.body.appendChild(overlay)

      const remove = () => {
        overlay.remove()
        document.removeEventListener('keydown', onKey)
      }

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') remove()
      }

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) remove()
      })
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        remove()
      })
      document.addEventListener('keydown', onKey)
    })
  }

  let attempts = 0
  function tryAttach() {
    const blocks = document.querySelectorAll<HTMLElement>('.mermaid')
    blocks.forEach(attachZoom)
    if (blocks.length === 0 || attempts < 20) {
      attempts++
      setTimeout(tryAttach, 500)
    }
  }
  setTimeout(tryAttach, 300)
}

function setupCopyCodeButtons() {
  if (typeof window === 'undefined') return

  document.querySelectorAll<HTMLDivElement>('.vp-doc div[class*="language-"]').forEach((block) => {
    if (block.querySelector('.copy-code-btn')) return

    const btn = document.createElement('button')
    btn.className = 'copy-code-btn'
    btn.innerHTML = '📋'
    btn.title = 'Copiar código'
    btn.addEventListener('click', async () => {
      const code = block.querySelector('pre code')?.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        btn.innerHTML = '✓'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.innerHTML = '📋'
          btn.classList.remove('copied')
        }, 2000)
      } catch {
        btn.innerHTML = '✗'
        setTimeout(() => { btn.innerHTML = '📋' }, 2000)
      }
    })
    block.style.position = 'relative'
    block.appendChild(btn)
  })
}

function setupReadingPosition() {
  if (typeof window === 'undefined') return
  const key = 'banking-challenges:pos:' + window.location.pathname

  const saved = sessionStorage.getItem(key)
  if (saved) {
    const y = parseInt(saved, 10)
    if (y > 100) {
      const btn = document.createElement('div')
      btn.className = 'resume-reading-toast'
      btn.innerHTML = '📍 Continuar de onde parou'
      btn.addEventListener('click', () => {
        window.scrollTo({ top: y, behavior: 'smooth' })
        btn.remove()
      })
      document.body.appendChild(btn)
      setTimeout(() => btn.classList.add('visible'), 100)
      setTimeout(() => {
        btn.classList.remove('visible')
        setTimeout(() => btn.remove(), 300)
      }, 8000)
    }
  }

  let saveTimeout: ReturnType<typeof setTimeout>
  window.addEventListener('scroll', () => {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      sessionStorage.setItem(key, String(window.scrollY))
    }, 1000)
  }, { passive: true })
}

function setupScrollSpy() {
  if (typeof window === 'undefined') return

  const outlineLinks = document.querySelectorAll<HTMLAnchorElement>('.VPDocOutlineItem .outline-link')

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id
        outlineLinks.forEach((link) => {
          const href = link.getAttribute('href')
          link.classList.toggle('outline-active', href === '#' + id)
        })
      }
    }
  }, { rootMargin: '-80px 0px -80% 0px' })

  document.querySelectorAll<HTMLElement>('.vp-doc h2[id], .vp-doc h3[id]').forEach((h) => {
    observer.observe(h)
  })
}

function injectReadingTime() {
  if (typeof window === 'undefined') return
  const h1 = document.querySelector('.vp-doc h1')
  if (!h1) return

  const content = document.querySelector('.vp-doc')
  if (!content) return

  const text = content.textContent || ''
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))

  const el = document.createElement('span')
  el.className = 'reading-time-inline'
  el.innerHTML = `⏱️ ${minutes} min de leitura · ~${words.toLocaleString()} palavras`
  h1.insertAdjacentElement('afterend', el)
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('LanguageToggle', LanguageToggle)
    app.component('ReadingProgress', ReadingProgress)
    app.component('ReadingTime', ReadingTime)
    app.component('FloatingNav', FloatingNav)
    app.component('FocusMode', FocusMode)
    app.component('Quiz', Quiz)
    app.component('Checkpoint', Checkpoint)
    app.component('BookmarksPanel', BookmarksPanel)
    app.component('GiscusComments', GiscusComments)
    app.component('AchievementToast', AchievementToast)
    app.component('SidebarProgress', SidebarProgress)
    app.component('FlashcardReview', FlashcardReview)
    app.component('ExportNotes', ExportNotes)
  },
  setup() {
    const { lang } = useData()

    onMounted(() => {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        })
        mermaid.default.run().then(() => {
          setupMermaidZoom()
          setupCopyCodeButtons()
          setupReadingPosition()
          setupScrollSpy()
          injectReadingTime()
        })
      })
    })

    watch(lang, () => {
      nextTick(() => {
        import('mermaid').then((mermaid) => {
          mermaid.default.run().then(() => {
            setupMermaidZoom()
            setupCopyCodeButtons()
            setupScrollSpy()
          })
        })
      })
    })
  },
}
