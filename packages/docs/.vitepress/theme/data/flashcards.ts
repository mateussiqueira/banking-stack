export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface CardState {
  id: string
  ef: number
  interval: number
  repetitions: number
  nextReview: string
  lastQuality: number
}

export function getInitialCardState(id: string): CardState {
  return { id, ef: 2.5, interval: 0, repetitions: 0, nextReview: '', lastQuality: 0 }
}

export function sm2Schedule(card: CardState, quality: number): CardState {
  const q = Math.max(0, Math.min(5, quality))

  if (q < 3) {
    return { ...card, interval: 1, repetitions: 0, nextReview: tomorrow(), lastQuality: q, ef: Math.max(1.3, card.ef) }
  }

  let interval: number
  if (card.repetitions === 0) interval = 1
  else if (card.repetitions === 1) interval = 6
  else interval = Math.round(card.interval * card.ef)

  const ef = card.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const clampedEf = Math.max(1.3, ef)

  return {
    ...card,
    ef: clampedEf,
    interval,
    repetitions: card.repetitions + 1,
    nextReview: daysFromNow(interval),
    lastQuality: q,
  }
}

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const STORAGE_KEY = 'bc_flashcards'

export function loadCardStates(): Record<string, CardState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCardStates(states: Record<string, CardState>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(states)) } catch {}
}

export function getDueCards(deck: Flashcard[], states: Record<string, CardState>): Flashcard[] {
  const today = new Date().toISOString().slice(0, 10)
  return deck.filter(card => {
    const state = states[card.id]
    if (!state || state.nextReview === '') return true
    return state.nextReview <= today
  })
}

export function getDueCount(deck: Flashcard[], states: Record<string, CardState>): number {
  return getDueCards(deck, states).length
}

export const FLASHCARD_DECKS: Record<string, Flashcard[]> = {
  '01-ledger': [
    { id: 'l1', front: 'Por que paginacao cursor-based e obrigatoria em sistemas financeiros?', back: 'Offset desvia quando novos registros sao inseridos, causando duplicacao ou omissao de dados. Com cursor, voce diz "a partir daqui", eliminando o problema.' },
    { id: 'l2', front: 'O que o DataLoader faz e por que ele deve ser instanciado por request?', back: 'DataLoader faz batching e deduplicacao de queries. Deve ser instanciado por request porque o cache precisa ser isolado entre usuarios — um singleton global vazaria dados entre sessoes.' },
    { id: 'l3', front: 'O que e necessario para transacoes ACID no MongoDB?', back: 'MongoDB precisa estar em Replica Set. Single node so tem atomicidade por documento. O Replica Set implementa o protocolo de commit multi-documento.' },
    { id: 'l4', front: 'Por que usar lean() do Mongoose no DataLoader?', back: 'lean() retorna POJOs sem os getters/setters do Mongoose, economizando memoria e sendo muito mais rapido. Para leitura pura, nao precisa da hidratacao completa.' },
    { id: 'l5', front: 'O que acontece com duas transferencias concorrentes na mesma conta?', back: 'O MongoDB usa snapshot isolation. Uma recebe WriteConflict no commit. Nao e erro — e comportamento esperado. A solucao e retry com exponential backoff + idempotency key.' },
  ],
  '02-spi': [
    { id: 's1', front: 'Qual padrao de mensagens o SPI usa?', back: 'ISO 20022 em XML. pacs.008 para instrucao de pagamento, pacs.002 para confirmacao (ACSC = liquidado), camt.053 para extrato diario da Conta PI.' },
    { id: 's2', front: 'Para que serve o EndToEndId?', back: 'Identificador unico global gerado pelo PSP de origem. Chave primaria para idempotencia, conciliacao diaria contra o camt.053, e rastreamento de fraudes.' },
    { id: 's3', front: 'Por que a conciliacao diaria e obrigatoria?', back: 'Exigencia regulatoria do BCB. Todo PSP precisa comparar seu registro local com o extrato oficial da Conta PI. Discrepancia nao resolvida gera multa.' },
    { id: 's4', front: 'Por que a assinatura XML e o ponto mais fragil do SPI?', back: 'Um unico byte diferente (whitespace, encoding, namespace) quebra a assinatura e o BCB rejeita. Testes exaustivos de canonicalizacao sao essenciais.' },
    { id: 's5', front: 'O que significa ACSC em uma resposta pacs.002?', back: 'AcceptedSettlementCompleted. Status final: dinheiro ja saiu da Conta PI do pagador e entrou na do recebedor. Pagamento liquidado.' },
  ],
  '03-dict': [
    { id: 'd1', front: 'Qual o proposito do DICT?', back: 'Resolver chaves PIX (CPF, e-mail, telefone, aleatoria) para dados bancarios (ISPB, agencia, conta). E a agenda telefonica do PIX.' },
    { id: 'd2', front: 'O que e anti-enumeration no DICT?', back: 'Mecanismo que impede atacantes de descobrir quais chaves PIX existem por forca bruta, protegendo a privacidade dos usuarios.' },
    { id: 'd3', front: 'Qual a race condition mais critica do DICT?', back: 'Portabilidade de chave: dois bancos tentando reivindicar a mesma chave ao mesmo tempo. Exige lock distribuido (Redlock) para consistencia.' },
    { id: 'd4', front: 'Por que nao confiar apenas em cache?', back: 'Cache desatualizado apos portabilidade pode enviar PIX para o banco errado. O dinheiro vai para uma conta inexistente e o pacs.002 volta RJCT. Cache precisa de TTL curto e write-through.' },
    { id: 'd5', front: 'Quais os 4 tipos de chave PIX?', back: 'CPF/CNPJ, e-mail, telefone (+55), e chave aleatoria (UUID v4). A aleatoria e a mais segura pois nao expoe dados pessoais.' },
  ],
}
