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
            {{ pageTitle ? `Estou vendo a pagina "${pageTitle}".` : '' }} Posso te ajudar com duvidas sobre este topico. Pergunte algo sobre o conteudo desta pagina.
          </div>
          <div v-for="(msg, i) in chat" :key="i" :class="'ai-msg ' + msg.role">
            <div class="ai-msg-text">{{ msg.text }}</div>
            <div v-if="msg.role === 'assistant' && msg.related && msg.related.length" class="ai-related">
              <div class="ai-related-label">Topicos relacionados:</div>
              <button
                v-for="r in msg.related"
                :key="r"
                class="ai-related-chip"
                @click="askRelated(r)"
              >{{ r }}</button>
            </div>
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

interface Message {
  role: 'user' | 'assistant'
  text: string
  related?: string[]
}

const knowledgeBase: Record<string, string> = {
  'o que é ledger': 'Um ledger (livro-razão) é o coração contábil de qualquer fintech. Ele armazena todas as movimentações financeiras em partidas dobradas (double-entry), garantindo que débito e crédito sempre se equilibrem. Cada transação gera lançamentos atômicos: se um lado falhar, o outro também é revertido. O ledger é append-only — nunca se apaga um lançamento, apenas se faz um ajuste compensatório. Isso garante auditabilidade completa.',
  'o que é double-entry': 'Double-entry bookkeeping foi inventado por Luca Pacioli em 1494. Cada transação tem dois lados: débito (saída de uma conta) e crédito (entrada em outra). A soma dos débitos sempre iguala a soma dos créditos. Em sistemas modernos, isso garante consistência financeira — se o balanço não fecha, algo está errado. Exemplo: quando você paga R$ 100, sai R$ 100 da sua conta (crédito) e entra R$ 100 na conta do recebedor (débito).',
  'o que é dataloader': 'DataLoader é uma biblioteca do Facebook que faz batching e deduplicação de requisições a banco de dados. Em vez de fazer N queries separadas para N IDs, ele agrupa tudo em uma única query com WHERE id IN (...). Também faz caching por request, então se o mesmo ID for pedido duas vezes na mesma requisição GraphQL, só vai ao banco uma vez. Essencial para evitar o problema N+1.',
  'o que é spi': 'O SPI (Sistema de Pagamentos Instantâneos) é o middleware do Banco Central do Brasil que interliga todos os participantes do PIX. Ele recebe ordens de pagamento dos participantes indiretos (fintechs) via participantes diretos (bancos tradicionais), valida as contas no DICT, faz a liquidação em tempo real nas contas de settlement, e devolve a confirmação em segundos. Opera 24/7.',
  'o que é pacs.008': 'pacs.008 é a mensagem ISO 20022 de instrução de pagamento entre instituições financeiras. No contexto do PIX, é o envelope que carrega os dados da transferência: valor, conta origem, conta destino, finalidade, EndToEndId. O SPI usa pacs.008 para iniciar a liquidação e pacs.002 para devolver o status (aceito/rejeitado).',
  'o que é dict': 'O DICT (Diretório de Identificadores de Contas Transacionais) é o catálogo central do Banco Central que mapeia chaves PIX (CPF/CNPJ, email, telefone, chave aleatória) para contas bancárias específicas. Quando alguém faz um PIX usando chave (em vez de agência/conta), o SPI consulta o DICT para descobrir qual instituição e conta receberá o dinheiro. O DICT é a "lista telefônica" do PIX.',
  'o que é endtoendid': 'O EndToEndId é um identificador único global (UUID) que acompanha cada transação PIX do início ao fim. Ele permite rastrear um pagamento desde a origem (app do pagador) até o destino (conta do recebedor), passando pelo SPI e pelo participante indireto. É essencial para conciliação, devoluções e resolução de disputas — funciona como o "código de rastreio" do PIX.',
  'como funciona pix': 'O PIX funciona em 4 etapas: 1) Iniciação: o pagador solicita a transferência no app da fintech. 2) Roteamento: a fintech consulta o DICT (se for chave) e envia um pacs.008 ao SPI via participante direto. 3) Liquidação: o SPI valida, debita da conta de settlement da fintech pagadora e credita na fintech recebedora em tempo real. 4) Confirmação: o SPI devolve um pacs.002 com status, e a fintech notifica o usuário. Tudo em menos de 10 segundos.',
  'o que é iso 20022': 'ISO 20022 é o padrão internacional de mensagens financeiras definido pela ISO. Ele usa XML (e cada vez mais JSON/ASN.1) com um modelo de dados rico que separa o significado do formato. No PIX, mensagens como pacs.008, pacs.002, camt.056 seguem ISO 20022. A grande vantagem é interoperabilidade global — bancos do mundo todo falam a mesma língua.',
  'o que é conciliação': 'Conciliação é o processo de comparar o extrato oficial (do SPI, do banco parceiro, ou do ledger interno) com os registros da fintech para garantir que tudo bate. Tipicamente envolve: baixar extratos, cruzar por EndToEndId, identificar divergências (valores diferentes, transações faltando, duplicadas), e aplicar ajustes. É o checkpoint diário que garante que nenhum centavo sumiu.',
  definicao: 'O ledger é a base de dados central que registra toda movimentação financeira de forma imutável. O SPI intermedia pagamentos instantâneos entre instituições. O DICT mapeia chaves PIX para contas. pacs.008 é o envelope da transação. EndToEndId rastreia cada pagamento. ISO 20022 é o padrão de mensagens. A conciliação fecha o ciclo, garantindo que tudo bate.',
}

const knowledgeRelated: Record<string, string[]> = {
  'o que é ledger': ['double-entry', 'conciliação', 'endtoendid'],
  'o que é spi': ['pacs.008', 'iso 20022', 'dict'],
  'o que é dict': ['pix', 'spi', 'endtoendid'],
  'o que é pacs.008': ['spi', 'iso 20022', 'pix'],
  'o que é endtoendid': ['pacs.008', 'conciliação', 'dict'],
  'como funciona pix': ['spi', 'dict', 'pacs.008'],
  'o que é iso 20022': ['pacs.008', 'spi'],
  'o que é conciliação': ['ledger', 'endtoendid', 'pacs.008'],
  'o que é dataloader': ['01-ledger'],
  definicao: ['ledger', 'spi', 'dict', 'pix'],
}

function slugify(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const visible = ref(false)
const open = ref(false)
const input = ref('')
const loading = ref(false)
const chat = ref<Message[]>([])
const messages = ref<HTMLDivElement>()

let pageContent = ''
let pageTitle = ''
let pageHeadings: string[] = []
let pageFlashcards: string[] = []

onMounted(() => {
  visible.value = true
  const doc = document.querySelector('.vp-doc')
  if (!doc) return

  pageContent = (doc.textContent || '').slice(0, 8000)

  const h1 = doc.querySelector('h1')
  if (h1) pageTitle = h1.textContent || ''

  const h2s = doc.querySelectorAll('h2')
  pageHeadings = Array.from(h2s).map(h => (h.textContent || '').trim()).filter(Boolean)

  const flashcardEls = doc.querySelectorAll('.flashcard, .quiz, [class*="flashcard"], [class*="quiz"]')
  pageFlashcards = Array.from(flashcardEls).map(el => (el.textContent || '').slice(0, 300)).filter(Boolean)
})

function findBestFaq(query: string): { key: string; answer: string } | null {
  const q = slugify(query)
  if (!q) return null

  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (q.includes(slugify(key)) || slugify(key).includes(q)) {
      return { key, answer }
    }
  }
  return null
}

function searchPageContent(query: string): string {
  const paragraphs = pageContent.split('\n').filter(p => p.trim().length > 30)
  const q = slugify(query)
  const words = q.split(' ').filter(w => w.length > 2)

  const scored = paragraphs.map(p => {
    const pLower = slugify(p)
    let score = 0
    for (const w of words) {
      const count = (pLower.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      score += count
      if (pLower.includes(w)) score += 3
    }
    return { text: p, score }
  })

  const top = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (top.length === 0) {
    if (pageHeadings.length) {
      return `Nao encontrei informacao especifica sobre "${query}" nesta pagina. Tente perguntar sobre um destes topicos: ${pageHeadings.slice(0, 5).join(', ')}.`
    }
    return `Nao encontrei informacao especifica sobre "${query}" nesta pagina. Tente reformular a pergunta ou consulte a documentacao completa.`
  }

  return top.map(t => t.text).join('\n\n')
}

function buildRelatedTopics(faqKey: string): string[] {
  const related = knowledgeRelated[faqKey]
  if (!related) return []
  return related.map(r => {
    for (const key of Object.keys(knowledgeBase)) {
      if (key.includes(r)) return key
    }
    return r
  })
}

async function send() {
  const q = input.value.trim()
  if (!q || loading.value) return

  chat.value.push({ role: 'user', text: q })
  input.value = ''
  loading.value = true

  await nextTick()
  messages.value?.scrollTo({ top: messages.value.scrollHeight, behavior: 'smooth' })

  await new Promise(r => setTimeout(r, 400 + Math.random() * 600))

  const faq = findBestFaq(q)
  let answer: string
  let related: string[] = []

  if (faq) {
    answer = faq.answer
    related = buildRelatedTopics(faq.key)
  } else {
    answer = searchPageContent(q)
    related = pageHeadings.slice(0, 4)
  }

  chat.value.push({ role: 'assistant', text: answer, related })
  loading.value = false

  await nextTick()
  messages.value?.scrollTo({ top: messages.value.scrollHeight, behavior: 'smooth' })
}

function askRelated(topic: string) {
  input.value = `o que é ${topic}`
  send()
}
</script>

<style scoped>
.ai-helper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: 'Inter', system-ui, sans-serif;
}

.ai-toggle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  color: white;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;
}
.ai-toggle:hover {
  background: #1d4ed8;
  transform: scale(1.05);
}
.ai-toggle.active {
  background: #1e40af;
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.5);
}

.ai-panel {
  position: absolute;
  bottom: 56px;
  right: 0;
  width: 380px;
  max-height: 520px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dark .ai-panel {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.dark .ai-header {
  border-bottom-color: #334155;
  background: #0f172a;
}
.ai-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.dark .ai-header h4 {
  color: #f1f5f9;
}
.ai-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.ai-close:hover {
  color: #64748b;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
}

.ai-msg {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
}
.ai-msg.system {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.dark .ai-msg.system {
  background: #052e16;
  color: #86efac;
  border-color: #166534;
}
.ai-msg.user {
  background: #eff6ff;
  color: #1e40af;
  align-self: flex-end;
  border: 1px solid #bfdbfe;
  max-width: 85%;
}
.dark .ai-msg.user {
  background: #172554;
  color: #93c5fd;
  border-color: #1e3a5f;
}
.ai-msg.assistant {
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
}
.dark .ai-msg.assistant {
  background: #0f172a;
  color: #cbd5e1;
  border-color: #334155;
}

.ai-msg-text {
  margin-bottom: 6px;
}

.ai-related {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}
.dark .ai-related {
  border-top-color: #334155;
}
.ai-related-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}
.dark .ai-related-label {
  color: #94a3b8;
}
.ai-related-chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 3px 10px;
  font-size: 11.5px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.ai-related-chip:hover {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.dark .ai-related-chip {
  border-color: #475569;
  background: #1e293b;
  color: #cbd5e1;
}
.dark .ai-related-chip:hover {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.ai-input {
  display: flex;
  padding: 10px 14px;
  border-top: 1px solid #e2e8f0;
  gap: 8px;
}
.dark .ai-input {
  border-top-color: #334155;
}
.ai-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #1e293b;
}
.dark .ai-input input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
.ai-input input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.ai-input button {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.ai-input button:hover:not(:disabled) {
  background: #1d4ed8;
}
.ai-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-enter-active { transition: all 0.25s ease-out; }
.slide-leave-active { transition: all 0.2s ease-in; }
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
</style>
