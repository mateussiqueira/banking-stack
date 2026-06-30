<template>
  <div v-if="hasContent" class="export-notes">
    <button @click="showPanel = !showPanel" class="export-toggle" title="Exportar notas">
      Exportar
    </button>

    <Transition name="slide">
      <div v-if="showPanel" class="export-panel">
        <h4>Exportar anotacoes</h4>
        <p class="export-desc">Seus bookmarks e notas deste desafio, prontos para copiar ou salvar.</p>

        <div class="export-preview">
          <pre>{{ exportText }}</pre>
        </div>

        <div class="export-actions">
          <button @click="copyExport" class="export-btn">{{ copied ? 'Copiado!' : 'Copiar' }}</button>
          <button @click="downloadExport" class="export-btn secondary">Baixar .md</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Bookmark { id: string; text: string; note: string; date: number }

const showPanel = ref(false)
const copied = ref(false)
const bookmarks = ref<Bookmark[]>([])

const hasContent = computed(() => bookmarks.value.length > 0)

const exportText = computed(() => {
  const title = document.querySelector('.vp-doc h1')?.textContent || 'Notas'
  const date = new Date().toLocaleDateString('pt-BR')
  let text = `# ${title}\nExportado em ${date}\n\n`
  for (const b of bookmarks.value) {
    text += `## Trecho\n> ${b.text}\n\n`
    if (b.note) text += `### Nota\n${b.note}\n\n`
    text += `---\n\n`
  }
  return text
})

onMounted(() => {
  try {
    const key = 'bc_bookmarks:' + window.location.pathname
    const raw = localStorage.getItem(key)
    if (raw) bookmarks.value = JSON.parse(raw)
  } catch {}
})

async function copyExport() {
  await navigator.clipboard.writeText(exportText.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function downloadExport() {
  const blob = new Blob([exportText.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'notas-banking-challenges.md'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
