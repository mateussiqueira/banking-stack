<template>
  <div class="bookmark-panel" v-if="visible">
  <button class="bookmark-toggle" :class="{ active: panelOpen }" @click="panelOpen = !panelOpen" title="Bookmarks">
    {{ bookmarks.length }}
  </button>

    <Transition name="slide">
      <div v-if="panelOpen" class="bookmark-drawer">
        <div class="bookmark-header">
          <h4>Seus Bookmarks</h4>
          <button @click="clearAll" class="bookmark-clear-btn" title="Limpar todos">x</button>
        </div>

        <div v-if="bookmarks.length === 0" class="bookmark-empty">
          Selecione texto e clique em <strong>Salvar Bookmark</strong> para adicionar.
        </div>

        <div v-for="b in bookmarks" :key="b.id" class="bookmark-item">
          <div class="bookmark-text" @click="scrollTo(b)" :title="'Voltar ao texto'">
            <span class="bookmark-quote">"{{ b.text.slice(0, 120) }}{{ b.text.length > 120 ? '...' : '' }}"</span>
          </div>
          <textarea
            v-if="b.editing"
            v-model="b.note"
            class="bookmark-note-input"
            placeholder="Sua nota..."
            rows="3"
          />
          <p v-else-if="b.note" class="bookmark-note">{{ b.note }}</p>
          <div class="bookmark-actions">
            <button @click="toggleEdit(b)" class="bookmark-action-btn">{{ b.editing ? '💾' : '✏️' }}</button>
            <button @click="remove(b.id)" class="bookmark-action-btn">🗑️</button>
          </div>
          <span class="bookmark-date">{{ new Date(b.date).toLocaleDateString('pt-BR') }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Bookmark {
  id: string
  text: string
  note: string
  date: number
  scrollY: number
  editing: boolean
}

const visible = ref(false)
const panelOpen = ref(false)
const bookmarks = ref<Bookmark[]>([])

function loadBookmarks() {
  try {
    const key = 'bc_bookmarks:' + window.location.pathname
    const raw = localStorage.getItem(key)
    if (raw) bookmarks.value = JSON.parse(raw)
  } catch {}
}

function saveBookmarks() {
  try {
    const key = 'bc_bookmarks:' + window.location.pathname
    localStorage.setItem(key, JSON.stringify(bookmarks.value))
  } catch {}
}

function addBookmark(text: string) {
  const bookmark: Bookmark = {
    id: Date.now().toString(),
    text,
    note: '',
    date: Date.now(),
    scrollY: window.scrollY,
    editing: true,
  }
  bookmarks.value.unshift(bookmark)
  saveBookmarks()
  panelOpen.value = true
}

function remove(id: string) {
  bookmarks.value = bookmarks.value.filter(b => b.id !== id)
  saveBookmarks()
}

function toggleEdit(b: Bookmark) {
  b.editing = !b.editing
  if (!b.editing) saveBookmarks()
}

function scrollTo(b: Bookmark) {
  window.scrollTo({ top: b.scrollY - 100, behavior: 'smooth' })
}

function clearAll() {
  bookmarks.value = []
  saveBookmarks()
}

let selectionHandler: (() => void) | null = null

onMounted(() => {
  loadBookmarks()
  visible.value = true

  selectionHandler = () => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 10) {
      const range = sel?.getRangeAt(0)
      if (range) {
        const existing = document.querySelector('.text-selection-popup')
        if (existing) existing.remove()

        const popup = document.createElement('div')
        popup.className = 'text-selection-popup'
        popup.innerHTML = '🔖 Salvar Bookmark'
        popup.addEventListener('click', () => {
          addBookmark(text)
          popup.remove()
          sel?.removeAllRanges()
        })

        const rect = range.getBoundingClientRect()
        popup.style.top = rect.bottom + window.scrollY + 4 + 'px'
        popup.style.left = rect.left + window.scrollX + 'px'

        document.body.appendChild(popup)
        document.addEventListener('click', function dismiss(e) {
          if (!popup.contains(e.target as Node)) {
            popup.remove()
            document.removeEventListener('click', dismiss)
          }
        })
      }
    }
  }

  document.addEventListener('mouseup', selectionHandler)
})

onUnmounted(() => {
  if (selectionHandler) {
    document.removeEventListener('mouseup', selectionHandler)
  }
})
</script>
