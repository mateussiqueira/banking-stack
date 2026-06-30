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
  '04-iso8583': [
    { id: 'i1', front: 'O que e ISO 8583?', back: 'Padrao internacional para mensagens de transacoes financeiras com cartao. Define estrutura de mensagem com MTI, bitmap e data elements.' },
    { id: 'i2', front: 'O que e o bitmap no ISO 8583?', back: 'Campo binario que indica quais data elements estao presentes na mensagem. Cada bit representa um campo — bit 1 ligado = campo 1 presente.' },
    { id: 'i3', front: 'O que e MTI (Message Type Indicator)?', back: 'Campo de 4 digitos que identifica a funcao da mensagem: versao ISO, classe (authorization, financial), funcao (request, response) e origem (acquirer, issuer).' },
    { id: 'i4', front: 'Qual a diferenca entre bitmap primario e secundario?', back: 'Primario cobre data elements 1 a 64. Secundario cobre 65 a 128. O bit 1 do primario indica se o secundario esta presente.' },
    { id: 'i5', front: 'Por que ISO 8583 usa campos de tamanho variavel?', back: 'Para eficiencia de largura de banda. Campos fixos desperdicam bytes. Tamanho variavel com LL (2 digitos de length) ou LLL (3 digitos) e o padrao na industria.' },
  ],
  '05-open-finance': [
    { id: 'of1', front: 'O que e Open Finance e como se diferencia do Open Banking?', back: 'Extensao do Open Banking alem de dados bancarios: seguros, investimentos, previdencia, cambio. E o compartilhamento consentido de todo ecossistema financeiro do cliente.' },
    { id: 'of2', front: 'O que e consentimento no Open Finance?', back: 'Autorizacao explicita e granulada do cliente para um TPP acessar seus dados ou iniciar pagamentos. Define escopo, prazo e pode ser revogado a qualquer momento.' },
    { id: 'of3', front: 'O que e FAPI e por que e mais restritivo que OAuth padrao?', back: 'Financial-grade API — perfil de seguranca OAuth 2.0 do OpenID Foundation. Exige PAR, JARM, MTLS, PKCE. Proibe refresh token rotation insegura e redirects sem PAR.' },
    { id: 'of4', front: 'Qual a diferenca entre AISP e PISP?', back: 'AISP (Account Information) so le dados. PISP (Payment Initiation) inicia pagamentos. AISP requer consentimento de leitura, PISP requer consentimento de pagamento — niveis de risco diferentes.' },
    { id: 'of5', front: 'O que e o ciclo de vida do consentimento?', back: 'Criacao (definicao de escopo e prazo) → Autorizacao (cliente autentica e confirma) → Consumo (TPP acessa dados via API) → Expiracao ou Revogacao (cliente ou sistema encerra).' },
  ],
  '05-workflow': [
    { id: 'wf1', front: 'O que e uma saga em sistemas distribuidos?', back: 'Sequencia de transacoes locais onde cada passo tem uma transacao compensatoria. Se um passo falha, as transacoes compensatorias sao executadas em ordem reversa para desfazer os passos anteriores.' },
    { id: 'wf2', front: 'Quais os dois estilos de coordenacao de saga?', back: 'Coreografia (event-driven, cada servico reage a eventos) e Orquestracao (um coordenador central chama cada servico). Orquestracao e preferida em banking por ter fluxo de controle explicito e auditavel.' },
    { id: 'wf3', front: 'Por que uma maquina de estados e essencial em workflows financeiros?', back: 'Garante que o sistema so transicione entre estados validos (ex: pendente → processando → liquidado). Impede estados impossiveis como "liquidado → pendente" e fornece trilha de auditoria.' },
    { id: 'wf4', front: 'Transacao compensatoria vs rollback — qual a diferenca?', back: 'Rollback desfaz dentro de uma mesma transacao atomica (ACID). Compensatoria e uma nova transacao que reverte semanticamente o efeito de uma transacao ja commitada — sao coisas diferentes.' },
    { id: 'wf5', front: 'O que acontece se uma transacao compensatoria tambem falha?', back: 'Entra em fila de dead letter para retry com backoff exponencial. Se continuar falhando, dispara alerta para operacao manual. NUNCA pode ser ignorada — o sistema ficaria inconsistente.' },
  ],
  '06-open-finance': [
    { id: 'op1', front: 'O que e PISP (Payment Initiation Service Provider)?', back: 'Provedor terceiro autorizado pelo BCB a iniciar pagamentos da conta do usuario. O cliente autoriza o PISP, que chama as APIs do banco para criar e executar a ordem de pagamento.' },
    { id: 'op2', front: 'Como funciona o consentimento de pagamento?', back: 'Cliente define: recebedor, valor maximo, validade. Banco autentica o cliente e registra o consentimento. PISP usa o consentId para iniciar pagamentos futuros dentro dos parametros autorizados.' },
    { id: 'op3', front: 'Para que servem webhooks no Open Finance?', back: 'Notificam TPPs em tempo real sobre eventos: consentimento autorizado, consentimento expirado, pagamento concluido, pagamento rejeitado. Evita polling e permite UX responsiva.' },
    { id: 'op4', front: 'Qual o risco de um consentimento expirado?', back: 'O PISP tenta iniciar pagamento e recebe 403. Dinheiro nao sai. Pior: o cliente acha que pagou. Solucao: PISP deve verificar validade ANTES de cada iniciacao e guiar o usuario para re-autorizar.' },
    { id: 'op5', front: 'O que contem o escopo de um consentimento de pagamento?', back: 'Valor maximo, moeda, data de expiracao, identificador do recebedor, contas envolvidas e flag de recorrencia. O banco deve rejeitar qualquer pagamento que exceda esses parametros.' },
  ],
  '07-nfse': [
    { id: 'nf1', front: 'O que e NFS-e e qual seu proposito?', back: 'Nota Fiscal de Servicos Eletronica — documento fiscal digital que registra a prestacao de servicos. Obrigatoria para toda empresa de servicos; substitui a nota fisica em papel.' },
    { id: 'nf2', front: 'O que e ABRASF e qual seu papel na NFS-e?', back: 'Associacao Brasileira das Secretarias de Financas das Capitais. Definiu o layout nacional padrao e os web services (envio, consulta, cancelamento) para interoperabilidade entre municipios.' },
    { id: 'nf3', front: 'Como funciona a assinatura XML na NFS-e?', back: 'XML e canonicalizado (C14n) e assinado com certificado digital ICP-Brasil (e-CNPJ ou e-CPF). A tag Signature e inserida no XML. O municipio valida a assinatura antes de autorizar.' },
    { id: 'nf4', front: 'Por que a canonicalizacao XML e o ponto mais sensivel?', back: 'Qualquer diferenca de whitespace, ordem de namespace, encoding ou atributo default quebra a assinatura. O XML precisa ser identico byte a byte apos canonicalizacao. Testar exaustivamente e obrigatorio.' },
    { id: 'nf5', front: 'Quais os principais eventos do ciclo de vida da NFS-e?', back: 'Emissao (envio do RPS ou lote), Autorizacao (municipio valida e retorna numero), Cancelamento (dentro do prazo legal), Substituicao (corrige NFS-e ja emitida). Cada um tem XML e web service proprio.' },
  ],
  '08-report': [
    { id: 'rp1', front: 'Por que usar Puppeteer para gerar PDFs em vez de bibliotecas como jsPDF?', back: 'HTML/CSS da controle preciso de layout, paginacao, headers, footers e estilos complexos. Escrever CSS e muito mais produtivo que calcular coordenadas x/y manualmente.' },
    { id: 'rp2', front: 'Qual o maior risco ao gerar relatorios grandes?', back: 'Estouro de memoria. Carregar 500 mil registros em memoria para gerar CSV ou PDF derruba o servidor. Solucao: streaming para CSV e processamento em chunks para PDF.' },
    { id: 'rp3', front: 'Como implementar geracao de CSV em escala?', back: 'Usar cursor paginado no banco e stream linha a linha direto para o response HTTP. Nunca acumular tudo em array. Node.js streams com pipeline() garantem back-pressure adequado.' },
    { id: 'rp4', front: 'Quando usar PDF vs CSV para relatorios financeiros?', back: 'PDF: extratos, comprovantes, relatorios para humanos. CSV: dados para maquinas — conciliacao, importacao em ERPs, analise em Excel. Cada formato tem publico e proposito diferentes.' },
    { id: 'rp5', front: 'Como lidar com timeout HTTP em geracao de relatorios demorados?', back: 'Nao gerar sincrono no request HTTP. Enfileirar job com job queue (BullMQ, SQS), processar em background, notificar o usuario via webhook/polling/email quando o relatorio estiver pronto.' },
  ],
  '09-leaky-bucket': [
    { id: 'lb1', front: 'Qual a diferenca entre Leaky Bucket e Token Bucket?', back: 'Leaky Bucket processa requisicoes a taxa constante e fixa — suaviza trafego mas nao permite bursts. Token Bucket acumula tokens ate um limite, permitindo bursts ocasionais sem exceder a taxa media.' },
    { id: 'lb2', front: 'O que e GCRA (Generic Cell Rate Algorithm)?', back: 'Algoritmo generico que implementa ambos os comportamentos (leaky e token bucket) com uma unica logica. Usa TAT (Theoretical Arrival Time) + limit para decidir se um request esta dentro do limite.' },
    { id: 'lb3', front: 'Por que rate limiting e critico em APIs financeiras?', back: 'Protege contra abuso, garante fair usage entre clientes e evita sobrecarga nos sistemas downstream (SPI, DICT). Sem rate limiting, um cliente pode consumir todos os recursos e derrubar os outros.' },
    { id: 'lb4', front: 'Onde armazenar os contadores de rate limit?', back: 'Redis com TTL. Operacoes atomicas (INCR + EXPIRE) garantem consistencia. Compartilhado entre todas as instancias. Em caso de falha do Redis, fallback para memoria local evita outage total.' },
    { id: 'lb5', front: 'O que retornar quando o rate limit e excedido?', back: 'HTTP 429 Too Many Requests + header Retry-After (segundos). Importante: NUNCA dropar transacao financeira silenciosamente — o cliente precisa saber que o request nao foi processado.' },
  ],
  '10-landing-page': [
    { id: 'lp1', front: 'O que sao Core Web Vitals e por que importam?', back: 'Metricas de experiencia do usuario do Google: LCP (carregamento), INP (interatividade), CLS (estabilidade visual). Sao fatores de ranqueamento no Google — impactam SEO diretamente.' },
    { id: 'lp2', front: 'Por que Next.js para landing pages?', back: 'SSR/SSG garantem SEO e First Paint rapido. Image Optimization automatico reduz LCP. File-system routing e API routes permitem full-stack em um unico projeto.' },
    { id: 'lp3', front: 'O que e CLS e como afeta conversao?', back: 'Cumulative Layout Shift — mudancas inesperadas de layout durante o carregamento. Causa cliques acidentais, frustracao, e queda direta na taxa de conversao e receita.' },
    { id: 'lp4', front: 'SSG vs SSR para landing page — qual escolher?', back: 'SSG (Static Site Generation) no build e ideal: mais rapido, mais barato, e melhor para SEO. Usar ISR (Incremental Static Regeneration) se precisar de atualizacoes frequentes sem rebuild completo.' },
    { id: 'lp5', front: 'Como medir Web Vitals em producao?', back: 'Real User Monitoring (RUM) com a biblioteca web-vitals ou Chrome UX Report. Lab data (Lighthouse) e util durante desenvolvimento, mas dados de usuarios reais mostram o impacto verdadeiro no ranqueamento.' },
  ],
  '11-kyc': [
    { id: 'ky1', front: 'O que e KYC e qual sua base regulatoria?', back: 'Know Your Customer — processo obrigatorio de identificacao e verificacao de clientes. Regulamentado pelo BCB (Circular 3.978) e Lei 9.613 (lavagem de dinheiro).' },
    { id: 'ky2', front: 'Quais os tres niveis de KYC no Brasil?', back: 'Simplificado (limite de transacao, dados basicos), Completo (documento oficial + biometria facial), e Reforcado (clientes de alto risco, validacao adicional de origem de fundos).' },
    { id: 'ky3', front: 'O que e liveness detection e por que e necessaria?', back: 'Tecnologia que verifica se a pessoa esta fisicamente presente na captura biometrica. Previne ataques com foto impressa, video gravado, mascara 3D ou deepfake.' },
    { id: 'ky4', front: 'Liveness ativo vs passivo — qual a diferenca?', back: 'Ativo: usuario realiza acoes (piscar, sorrir, virar rosto). Passivo: algoritmo analisa textura, micro-movimentos e iluminacao sem interacao. Passivo tem melhor UX e e mais dificil de burlar.' },
    { id: 'ky5', front: 'Quais documentos compoem o KYC completo?', back: 'Documento de identidade com foto (RG/CNH), CPF, comprovante de residencia recente (ate 90 dias), e biometria facial validada contra bases oficiais (SERPRO, Denatran, Justica Eleitoral).' },
  ],
  '12-proxmox': [
    { id: 'px1', front: 'O que e Proxmox VE?', back: 'Plataforma de virtualizacao open-source que combina KVM (maquinas virtuais) e LXC (containers) com gerenciamento web, cluster HA, backup integrado e suporte a storage distribuido (Ceph, ZFS).' },
    { id: 'px2', front: 'Por que ZFS para storage no Proxmox?', back: 'Snapshots instantaneas, compressao transparente (lz4, zstd), checksums para integridade de dados e replicacao eficiente (send/receive) para HA e disaster recovery.' },
    { id: 'px3', front: 'O que e Ceph no Proxmox e qual sua funcao?', back: 'Storage distribuido que oferece RBD (block), CephFS (file) e RGW (object). Permite live migration entre nodes sem storage compartilhado — cada node contribui com discos locais para o cluster.' },
    { id: 'px4', front: 'Como funciona o HA no Proxmox?', back: 'Quorum-based com 3+ nodes. Corosync mantem comunicacao do cluster. Watchdog fencing garante que node perdido seja isolado (fenced) para evitar split-brain. VMs sao automaticamente migradas.' },
    { id: 'px5', front: 'Proxmox Backup Server vs vzdump — quando usar cada um?', back: 'PBS: deduplicacao, incremental forever, criptografia, verificacao de integridade e restauracao granular. vzdump: backup simples e pontual. PBS e enterprise-grade; vzdump e quebra-galho para emergencia.' },
  ],
  '13-cicd': [
    { id: 'ci1', front: 'O que e blue-green deployment?', back: 'Dois ambientes identicos: blue (producao atual) e green (nova versao). Troca de trafego e atomica via load balancer. Rollback instantaneo: basta apontar de volta para o blue.' },
    { id: 'ci2', front: 'O que e GitOps e qual seu principio fundamental?', back: 'Git e a unica fonte de verdade para infraestrutura declarativa. PRs disparam deployments. Um reconciliation loop (ex: ArgoCD, Flux) garante que o estado real do cluster == estado no Git.' },
    { id: 'ci3', front: 'Por que usar multi-stage builds no Docker?', back: 'Imagem final menor (sem compiladores, node_modules de dev), melhor cache de camadas, separacao clara entre dependencias de build e runtime. Seguranca: menos binarios = menos superficie de ataque.' },
    { id: 'ci4', front: 'Canary vs Blue-Green — qual a diferenca?', back: 'Canary desvia porcentagem do trafego gradualmente (5% → 25% → 100%), permitindo validacao com usuarios reais. Blue-Green troca 100% de uma vez. Canary reduz blast radius; Blue-Green e mais simples.' },
    { id: 'ci5', front: 'O que e obrigatorio em um pipeline CI/CD financeiro?', back: 'SAST e SCA (seguranca de codigo e dependencias), testes de integracao com dependencias reais, migracoes de schema versionadas, e gates de aprovacao manual antes de deploy em producao.' },
  ],
  '14-rfc': [
    { id: 'rf1', front: 'O que e um RFC (Request for Comments)?', back: 'Documento que propoe uma mudanca ou nova funcionalidade, circulado para revisao do time antes da implementacao. Descreve problema, solucao proposta, alternativas, impacto e riscos.' },
    { id: 'rf2', front: 'O que e um ADR e quando escreve-lo?', back: 'Architecture Decision Record — registra uma decisao arquitetural ja tomada, seu contexto, consequencias e alternativas rejeitadas. Deve ser escrito quando a decisao e tomada, nao depois.' },
    { id: 'rf3', front: 'Qual a diferenca entre RFC e ADR?', back: 'RFC e proposta (antes da decisao), pede feedback e pode ser rejeitado. ADR e registro (depois da decisao), imutavel e documenta o que foi decidido e por que.' },
    { id: 'rf4', front: 'O que um ADR deve conter obrigatoriamente?', back: 'Titulo, status (proposed/accepted/deprecated/superseded), contexto (por que a decisao e necessaria), decisao (o que decidimos), consequencias (trade-offs) e alternativas consideradas com justificativa de rejeicao.' },
    { id: 'rf5', front: 'Por que o processo de RFC e critico em software bancario?', back: 'Auditabilidade regulatoria. RFCs e ADRs provam que decisoes foram deliberadas, revisadas e aprovadas — nao foram ad-hoc. Isso satisfaz requisitos de compliance e due diligence de engenharia.' },
  ],
  '15-pisp': [
    { id: 'pi1', front: 'O que e um PISP e qual sua funcao no ecossistema de pagamentos?', back: 'Payment Initiation Service Provider — provedor autorizado pelo BCB a iniciar pagamentos diretamente da conta do cliente. Elimina intermediarios e reduz custo de transacao comparado a cartoes.' },
    { id: 'pi2', front: 'Qual o fluxo completo de um pagamento iniciado por PISP?', back: 'Cliente seleciona PISP no checkout → PISP obtem consentimento → PISP cria ordem de pagamento → Banco autentica cliente (MFA) → Banco executa pagamento via SPI → PISP recebe pacs.002 confirmando.' },
    { id: 'pi3', front: 'Qual o principal risco do modelo PISP?', back: 'O PISP nunca detem os fundos, mas tem poder de iniciar pagamentos. Sem autenticacao forte e escopo restrito, um PISP comprometido poderia drenar contas. Consentimento granular e revogavel e defesa critica.' },
    { id: 'pi4', front: 'Como o PISP se diferencia de uma transferencia bancaria tradicional?', back: 'Tradicional: usuario sai do app/site, abre app do banco, faz ted/pix, volta. PISP: usuario fica no app/site do comercio. O PISP chama APIs do banco em nome do usuario — UX fluida e integrada.' },
    { id: 'pi5', front: 'O que e o modelo de consentimento PISP?', back: 'Usuario autoriza parametros especificos: recebedor, valor maximo, prazo de validade e recorrencia opcional. Banco valida e aplica limites em cada iniciacao. Revogavel a qualquer momento pelo usuario.' },
  ],
  '16-anticipation': [
    { id: 'an1', front: 'O que e antecipacao de recebiveis?', back: 'Lojista vende recebiveis futuros de cartao de credito para um banco/fintech com desconto, recebendo dinheiro a vista. A financeira assume o risco e recebe o valor integral na data de liquidacao.' },
    { id: 'an2', front: 'Qual o principal risco na antecipacao de recebiveis?', back: 'O recebivel pode ser cancelado (chargeback, estorno, contestacao). Se a financeira ja pagou o lojista e o recebivel nao se materializa, a perda e total. Modelagem de risco precisa estimar taxa de cancelamento.' },
    { id: 'an3', front: 'Como precificar uma operacao de antecipacao?', back: 'Taxa de desconto baseada em: prazo ate liquidacao (curva de juros), score de risco do lojista, diversificacao da carteira, ticket medio e taxa de cancelamento historica do setor.' },
    { id: 'an4', front: 'Antecipacao de recebiveis vs factoring — qual a diferenca?', back: 'Antecipacao opera sobre recebiveis de cartao (valores, datas certas via adquirente). Factoring opera sobre duplicatas/boletos de negocio (maior incerteza, risco de calote do sacado).' },
    { id: 'an5', front: 'Quais dados sao essenciais para modelagem de risco de antecipacao?', back: 'Historico de transacoes do lojista, taxa de chargeback, ticket medio e sazonalidade, score de credito (SERASA/Boa Vista), e dados setoriais de inadimplencia.' },
  ],
  '17-fraud-detection': [
    { id: 'fd1', front: 'Qual a diferenca entre deteccao de fraude e AML?', back: 'Fraude detecta transacoes nao autorizadas pelo titular (roubo de identidade, card testing, phishing). AML detecta lavagem de dinheiro (estruturacao, camadas, integracao). Sao padroes, regulacoes e equipes distintas.' },
    { id: 'fd2', front: 'O que e falso positivo em deteccao de fraude e qual seu impacto?', back: 'Transacao legitima bloqueada como suspeita. Muitos falsos positivos = cliente insatisfeito e churn. Poucos = prejuizo financeiro. Encontrar o equilibrio otimo e o desafio central da ML de fraude.' },
    { id: 'fd3', front: 'Quais tecnicas de ML sao comuns em deteccao de fraude?', back: 'Supervisionado: Random Forest, XGBoost (com labels historicos de fraude). Nao-supervisionado: Isolation Forest, autoencoders (detectam anomalias sem label). Grafos: detectam redes de mulas de dinheiro.' },
    { id: 'fd4', front: 'Por que feature engineering e a parte mais dificil?', back: 'Fraudadores evoluem constantemente. Features precisam capturar: velocidade (transacoes/minuto), desvio de perfil (valor vs media), device fingerprinting e padroes de rede — e se adaptar a novas taticas.' },
    { id: 'fd5', front: 'Deteccao em tempo real vs batch — qual usar e quando?', back: 'Tempo real (milissegundos): bloqueia transacao fraudulenta antes de completar. Batch (horas/dias): detecta padroes complexos para investigacao e realimenta o modelo. Ambos sao necessarios e complementares.' },
  ],
  '18-pix-automatico': [
    { id: 'pa1', front: 'O que e PIX Automatico?', back: 'Pagamentos recorrentes via PIX com consentimento previo. Cliente autoriza debitos futuros da conta sem autenticar cada transacao. Ideal para assinaturas, mensalidades e contas de consumo com liquidacao instantanea.' },
    { id: 'pa2', front: 'Como funciona o consentimento do PIX Automatico?', back: 'Cliente define recebedor, valor maximo, periodicidade e validade. Registrado no DICT. Revogavel a qualquer momento pelo pagador. Cobrancas que excedem parametros sao rejeitadas automaticamente pelo SPI.' },
    { id: 'pa3', front: 'PIX Automatico vs BolePix — qual a diferenca?', back: 'BolePix: QR Code com vencimento para cobranca pontual. PIX Automatico: debito recorrente sem QR Code iniciado pelo recebedor. Sao produtos complementares para casos de uso diferentes de cobranca.' },
    { id: 'pa4', front: 'Como smart contracts potencializam o PIX Automatico?', back: 'Pagamentos condicionais: "debitar R$ 100 no dia 5 SOMENTE se servico foi prestado". Smart contract verifica condicao on-chain (oraculo confirma entrega) e so entao dispara o debito — resolvendo disputas.' },
    { id: 'pa5', front: 'Qual o principal risco de seguranca do PIX Automatico?', back: 'Autenticacao delegada ao consentimento — recebedor comprometido pode iniciar multiplos debitos. Mitigacao: limites rigidos no consentimento, notificacoes push em tempo real e revogacao instantanea.' },
  ],
  '19-criptomoedas': [
    { id: 'cr1', front: 'UTXO (Bitcoin) vs modelo de contas (Ethereum) — qual a diferenca?', back: 'UTXO consome outputs anteriores e gera novos (como notas fisicas). Contas mantem saldo global por endereco (como ledger bancario). UTXO permite paralelismo; contas sao mais simples para smart contracts.' },
    { id: 'cr2', front: 'O que e uma HD Wallet (BIP32/BIP44)?', back: 'Carteira hierarquica deterministica: uma seed de 12/24 palavras deriva infinitas chaves em arvore. Backup trivial (so a seed) e privacidade (endereco novo por transacao sem gerenciar multiplas seeds).' },
    { id: 'cr3', front: 'Quais os modos de custodia de chaves privadas?', back: 'Hot wallet (conveniente, vulneravel). Cold wallet (seguro, inconveniente). MPC (chave fragmentada entre N partes). HSM (hardware certificado FIPS 140-2). Trade-off: conveniencia vs seguranca vs recuperabilidade.' },
    { id: 'cr4', front: 'Quais os tipos de stablecoin e qual o mais seguro?', back: 'Fiat-backed (USDC/USDT — custodia em banco, auditado), sobrecolateralizacao cripto (DAI — colateral > valor), algoritmica (UST/Luna — colapsou). Fiat-backed com custodiante regulado e o mais seguro.' },
    { id: 'cr5', front: 'Como funciona a indexacao de dados de blockchain?', back: 'Blockchain e otimizada para escrita, nao leitura. Indexadores (The Graph, Subsquid) escutam blocos, extraem eventos, transformam em esquema relacional e expoem via GraphQL/SQL para consultas eficientes.' },
  ],
  '20-tokenizacao': [
    { id: 'tk1', front: 'O que e tokenizacao de ativos?', back: 'Representacao digital de ativo fisico/financeiro em blockchain via smart contract. Permite fracionamento, liquidez 24/7 e reducao de intermediarios. Ex: imovel de R$ 1M dividido em 10.000 tokens de R$ 100.' },
    { id: 'tk2', front: 'ERC-20 vs ERC-721 — qual a diferenca?', back: 'ERC-20: tokens fungiveis — cada unidade e identica (stablecoins, governance). ERC-721: tokens nao-fungiveis — cada tokenId e unico com metadados proprios (imoveis, arte digital, identidade).' },
    { id: 'tk3', front: 'O que e DvP (Delivery versus Payment)?', back: 'Mecanismo atomico que garante que transferencia do ativo e pagamento acontecam simultaneamente. Ou ambos executam ou nenhum. Elimina risco de contraparte em transacoes de ativos tokenizados.' },
    { id: 'tk4', front: 'Qual o papel do oraculo em smart contracts de tokenizacao?', back: 'Smart contracts nao acessam dados externos. O oraculo injeta dados off-chain na blockchain de forma assinada e verificavel. Ex: confirmar registro em cartorio antes de liberar tokens imobiliarios.' },
    { id: 'tk5', front: 'Por que o custodiante e essencial na tokenizacao regulada?', back: 'Entidade regulada que detem guarda do ativo real e garante lastro 1:1 com tokens emitidos. Sem custodiante, o token e promessa vazia — investidor tem token mas nenhum direito legal sobre o ativo.' },
  ],
  '21-cbdc-drex': [
    { id: 'dx1', front: 'O que e Drex e como se diferencia do PIX?', back: 'PIX: meio de pagamento (transfere Real bancario). Drex: Real tokenizado (CBDC) emitido pelo BCB em blockchain (Besu). Dinheiro programavel com smart contracts e liquidacao atomica (DvP).' },
    { id: 'dx2', front: 'Qual o modelo two-tier do Drex?', back: 'Nivel 1: BCB emite/queima Drex mantendo soberania monetaria. Nivel 2: bancos distribuem para varejo fazendo KYC/AML. BCB nao desintermedia bancos — eles sao o canal regulado de distribuicao.' },
    { id: 'dx3', front: 'Por que Hyperledger Besu para o Drex?', back: 'Permissionado (apenas autorizados validam), EVM (suporta Solidity), IBFT 2.0 (finalidade instantanea sem fork) e Tessera (transacoes privadas entre partes). Mantido pela Linux Foundation.' },
    { id: 'dx4', front: 'O que e atomic settlement no Drex?', back: 'Duas operacoes (ex: Drex + token de titulo) executam como transacao unica e indivisivel. Ou ambas acontecem ou nenhuma. Risco de principal eliminado — comprador e vendedor protegidos.' },
    { id: 'dx5', front: 'Qual o papel dos pools de liquidez no Drex?', back: 'Provedores depositam Drex + tokens em smart contracts AMM formando mercado programatico. Resolve liquidez fragmentada: ativos tokenizados de pequenas empresas encontram compradores via pool.' },
  ],
  '22-esg-green-finance': [
    { id: 'es1', front: 'Como blockchain resolve fraudes em creditos de carbono?', back: 'Cada credito e NFT unico com proveniencia completa. Dupla contagem impossivel (token e unico). Aposentadoria = queimar token (irreversivel). Registro imutavel comprova adicionalidade e rastreabilidade.' },
    { id: 'es2', front: 'O que sao green bonds e como se diferenciam?', back: 'Titulos com recursos exclusivos para projetos verdes (energia renovavel, transporte limpo). Diferenca na governanca: uso de recursos segregado, projeto avaliado e selecionado, reporte de impacto obrigatorio.' },
    { id: 'es3', front: 'Como funciona um score ESG?', back: 'Agencias (MSCI, Sustainalytics) avaliam 3 pilares — Environmental, Social e Governance. Rating de AAA (lider) a CCC (retardatario). Impacta acesso a capital e custo de funding (greenium).' },
    { id: 'es4', front: 'O que e GRSAC e qual sua exigencia regulatoria?', back: 'Gestao de Riscos Sociais, Ambientais e Climaticos. Mandatorio para instituicoes financeiras (Res. CMN 4.943). Exige politica socioambiental, due diligence na concessao de credito e testes de estresse climatico.' },
    { id: 'es5', front: 'Como medir impacto real e evitar greenwashing?', back: 'Metricas padronizadas (IRIS+, GRI) quantificam tCO2 evitadas, MWh gerados. Auditoria independente valida. Blockchain + oraculos: sensores assinam dados on-chain em tempo real — imutavel e auditavel.' },
  ],
}
