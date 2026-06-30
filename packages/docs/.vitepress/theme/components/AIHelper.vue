<template>
  <div v-if="visible" class="ai-helper">
    <button class="ai-toggle" @click="open = !open" :class="{ active: open }" title="Assistente de Estudo">
      ?
    </button>

    <Transition name="slide">
      <div v-if="open" class="ai-panel">
        <div class="ai-header">
          <h4>Assistente de Estudo</h4>
          <button class="ai-close" @click="open = false">x</button>
        </div>
        <div class="ai-messages" ref="messages">
          <div class="ai-msg system">
            Posso te ajudar com duvidas sobre este topico. Pergunte algo sobre o conteudo desta pagina.
          </div>
          <div v-for="(msg, i) in chat" :key="i" :class="'ai-msg ' + msg.role">
            {{ msg.text }}
          </div>
        </div>
        <form class="ai-input" @submit.prevent="send">
          <input v-model="input" placeholder="Sua duvida..." :disabled="loading" />
          <button type="submit" :disabled="loading || !input.trim()">Enviar</button>
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Message { role: 'user' | 'assistant'; text: string }

const visible = ref(false)
const open = ref(false)
const input = ref('')
const loading = ref(false)
const chat = ref<Message[]>([])
const messages = ref<HTMLDivElement>()

let pageContent = ''

onMounted(() => {
  visible.value = true
  const doc = document.querySelector('.vp-doc')
  if (doc) pageContent = (doc.textContent || '').slice(0, 5000)
})

async function send() {
  const q = input.value.trim()
  if (!q || loading.value) return

  chat.value.push({ role: 'user', text: q })
  input.value = ''
  loading.value = true

  await nextTick()
  messages.value?.scrollTo({ top: messages.value.scrollHeight, behavior: 'smooth' })

  // Search page content for relevant context
  const paragraphs = pageContent.split('\n').filter(p => p.trim().length > 30)
  const relevant = paragraphs
    .filter(p => q.split(' ').some(w => p.toLowerCase().includes(w.toLowerCase())))
    .slice(0, 3)
    .join(' ')

  const context = relevant || 'Nao encontrei informacao especifica sobre isso nesta pagina. Tente reformular a pergunta ou consulte a documentacao completa.'

  // Simulate AI response with delay
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
  chat.value.push({ role: 'assistant', text: context })
  loading.value = false

  await nextTick()
  messages.value?.scrollTo({ top: messages.value.scrollHeight, behavior: 'smooth' })
}
</script>
