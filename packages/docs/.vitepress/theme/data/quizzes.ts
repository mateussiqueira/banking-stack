export interface QuizQuestion {
  id: string
  question: string
  options: { label: string; text: string }[]
  correct: number
  explanation: string
}
export interface ChallengeQuiz {
  slug: string
  questions: QuizQuestion[]
}
export const quizzes: ChallengeQuiz[] = [
  {
    slug: '01-ledger',
    questions: [
      {
        id: 'q1',
        question: 'Por que paginação cursor-based é obrigatória em sistemas financeiros?',
        options: [
          { label: 'A', text: 'Porque é mais rápido que offset' },
          { label: 'B', text: 'Porque offset desvia quando novos registros são inseridos, causando duplicação ou omissão de dados' },
          { label: 'C', text: 'Porque o MongoDB não suporta offset' },
          { label: 'D', text: 'Porque o GraphQL exige cursor-based' },
        ],
        correct: 1,
        explanation: 'Paginação com offset desvia porque a posição absoluta muda quando novos registros entram. Com cursor, você diz "a partir daqui", eliminando o problema. Em sistema financeiro, onde o usuário confere extrato linha a linha, cursor-based não é opcional — é obrigatório.',
      },
      {
        id: 'q2',
        question: 'Qual o propósito principal do DataLoader em um servidor GraphQL?',
        options: [
          { label: 'A', text: 'Cache distribuído entre múltiplos servidores' },
          { label: 'B', text: 'Compressão de respostas JSON' },
          { label: 'C', text: 'Batching de queries — agrupar múltiplas chamadas ao banco em uma única query com IN' },
          { label: 'D', text: 'Validação de schema GraphQL' },
        ],
        correct: 2,
        explanation: 'DataLoader faz deduplicação e batching: todas as chamadas individuais que acontecem no mesmo "tick" do event loop são agrupadas em uma única query batch. Sem ele, 10 transações com sender e receiver geram 21 queries — com ele, geram 3.',
      },
      {
        id: 'q3',
        question: 'O que é necessário para usar transações ACID no MongoDB?',
        options: [
          { label: 'A', text: 'Apenas MongoDB Community Edition' },
          { label: 'B', text: 'MongoDB em Replica Set — single node não suporta transações multi-documento' },
          { label: 'C', text: 'Um plugin especial de transactions para Mongoose' },
          { label: 'D', text: 'Substituir MongoDB por PostgreSQL' },
        ],
        correct: 1,
        explanation: 'Transações ACID no MongoDB exigem Replica Set. No single node, você só tem atomicidade por documento, mas não multi-documento. O Replica Set implementa o protocolo de commit que garante que todas as operações dentro de uma transação sejam aplicadas atomicamente.',
      },
      {
        id: 'q4',
        question: 'Por que usar `lean()` do Mongoose ao buscar dados para um DataLoader?',
        options: [
          { label: 'A', text: 'Para economizar memória — lean() retorna objetos planos em vez de documentos Mongoose hidratados' },
          { label: 'B', text: 'Para habilitar cache automático do MongoDB' },
          { label: 'C', text: 'Para compatibilidade com versões antigas do Mongoose' },
          { label: 'D', text: 'Para evitar injeção de SQL' },
        ],
        correct: 0,
        explanation: '`lean()` retorna POJOs (plain old JavaScript objects) sem os getters/setters, hooks, e métodos do Mongoose. É significativamente mais rápido e consome menos memória. Em operações de leitura puras como as do DataLoader, você não precisa da hidratação completa do Mongoose.',
      },
      {
        id: 'q5',
        question: 'O que acontece se duas transações concorrentes tentarem debitar da mesma conta ao mesmo tempo?',
        options: [
          { label: 'A', text: 'Ambas são processadas simultaneamente' },
          { label: 'B', text: 'Uma delas recebe WriteConflict no commitTransaction e precisa de retry' },
          { label: 'C', text: 'O MongoDB automaticamente faz merge das operações' },
          { label: 'D', text: 'A segunda transação espera a primeira terminar (lock pessimista)' },
        ],
        correct: 1,
        explanation: 'O MongoDB Replica Set usa snapshot isolation. Duas transações que modificam o mesmo documento vão conflitar no commit. Uma recebe WriteConflict — e isso não é erro, é comportamento esperado. A solução é retry com exponential backoff + idempotency key.',
      },
    ],
  },
  {
    slug: '02-spi',
    questions: [
      {
        id: 'q1',
        question: 'Qual padrão de mensagens o SPI usa para comunicação entre os PSPs e o Banco Central?',
        options: [
          { label: 'A', text: 'JSON sobre REST' },
          { label: 'B', text: 'ISO 8583 binário' },
          { label: 'C', text: 'ISO 20022 em XML (pacs.008, pacs.002, camt.053)' },
          { label: 'D', text: 'Protocol Buffers sobre gRPC' },
        ],
        correct: 2,
        explanation: 'O BCB escolheu ISO 20022 (XML) para o PIX, seguindo o padrão internacional do SWIFT. pacs.008 é a mensagem de instrução de pagamento, pacs.002 é a confirmação (ACSC = confirmado), e camt.053 é o extrato diário da Conta PI.',
      },
      {
        id: 'q2',
        question: 'O que significa o código ACSC em uma resposta pacs.002?',
        options: [
          { label: 'A', text: 'Aceito para Compensação — ainda não confirmado' },
          { label: 'B', text: 'Aceito e Compensado — pagamento liquidado com sucesso' },
          { label: 'C', text: 'Rejeitado por Crédito Suspeito' },
          { label: 'D', text: 'Agendado para Compensação Simples' },
        ],
        correct: 1,
        explanation: 'ACSC = AcceptedSettlementCompleted. É o status final: o dinheiro já saiu da Conta PI do banco pagador e entrou na Conta PI do banco recebedor. O pagamento está liquidado.',
      },
      {
        id: 'q3',
        question: 'Para que serve o EndToEndId em um pagamento PIX?',
        options: [
          { label: 'A', text: 'Identificar o usuário pagador' },
          { label: 'B', text: 'Identificar unicamente uma transação em todo o ecossistema — usado para idempotência, conciliação e rastreamento' },
          { label: 'C', text: 'Criptografar os dados da transação' },
          { label: 'D', text: 'Identificar o banco de destino' },
        ],
        correct: 1,
        explanation: 'EndToEndId é um identificador único global gerado pelo PSP de origem. Ele atravessa todo o ecossistema (PSP origem → SPI → PSP destino) e é a chave primária para idempotência, conciliação diária contra o camt.053, e rastreamento de fraudes.',
      },
      {
        id: 'q4',
        question: 'Por que a conciliação diária (camt.053) é obrigatória para PSPs?',
        options: [
          { label: 'A', text: 'É opcional, apenas boa prática' },
          { label: 'B', text: 'Para gerar o extrato do cliente' },
          { label: 'C', text: 'É exigência do BCB — discrepância não resolvida entre extrato local e camt.053 gera multa e ação regulatória' },
          { label: 'D', text: 'Para calcular tarifas do PIX' },
        ],
        correct: 2,
        explanation: 'A conciliação diária é uma exigência regulatória do BCB. Todo PSP precisa comparar seu registro interno de transações com o extrato oficial da Conta PI (camt.053). Qualquer discrepância precisa ser investigada e resolvida — caso contrário, multa.',
      },
      {
        id: 'q5',
        question: 'Por que a assinatura XML de cada pacs.008 é o ponto mais frágil da integração SPI?',
        options: [
          { label: 'A', text: 'Porque o XML é muito grande' },
          { label: 'B', text: 'Porque um único byte diferente (whitespace, encoding, namespace) quebra a assinatura, e o BCB rejeita a mensagem' },
          { label: 'C', text: 'Porque a assinatura expira a cada hora' },
          { label: 'D', text: 'Porque o certificado A1 é incompatível com Node.js' },
        ],
        correct: 1,
        explanation: 'A assinatura XML cobre cada byte do documento. Qualquer diferença de formatação (espaço, indentação, ordem de atributos, namespace) invalida a assinatura. O BCB rejeita a mensagem e o pagamento não é processado. Testes exaustivos de canonicalização XML são essenciais.',
      },
    ],
  },
  {
    slug: '03-dict',
    questions: [
      {
        id: 'q1',
        question: 'Qual o propósito do DICT no ecossistema PIX?',
        options: [
          { label: 'A', text: 'Processar pagamentos instantâneos' },
          { label: 'B', text: 'Resolver chaves PIX (CPF, e-mail, telefone, aleatória) para dados bancários (ISPB, agência, conta)' },
          { label: 'C', text: 'Gerar o extrato da Conta PI' },
          { label: 'D', text: 'Validar assinaturas digitais das mensagens ISO 20022' },
        ],
        correct: 1,
        explanation: 'O DICT (Diretório de Identificadores de Contas Transacionais) é o catálogo do BCB que mapeia chaves PIX para contas bancárias. Sem ele, você precisaria digitar agência + conta + CPF para cada PIX — justamente o que o DICT elimina.',
      },
      {
        id: 'q2',
        question: 'Por que o DICT implementa anti-enumeration?',
        options: [
          { label: 'A', text: 'Para acelerar consultas' },
          { label: 'B', text: 'Para impedir que atacantes descubram quais chaves PIX existem por força bruta, protegendo a privacidade dos usuários' },
          { label: 'C', text: 'Para reduzir o tráfego de rede' },
          { label: 'D', text: 'Para economizar espaço no Redis' },
        ],
        correct: 1,
        explanation: 'Anti-enumeration impede que um atacante faça consultas em massa para descobrir quais CPFs, e-mails ou telefones têm chave PIX cadastrada. Isso protege dados pessoais e evita phishing direcionado.',
      },
      {
        id: 'q3',
        question: 'Qual o problema de race condition mais crítico em um DICT distribuído?',
        options: [
          { label: 'A', text: 'Latência de rede entre nós do cluster' },
          { label: 'B', text: 'Portabilidade — dois bancos tentando reivindicar a mesma chave ao mesmo tempo, exigindo lock distribuído para consistência' },
          { label: 'C', text: 'Formatação inválida de chave PIX' },
          { label: 'D', text: 'Timeout de conexão com o BCB' },
        ],
        correct: 1,
        explanation: 'O cenário mais crítico é a portabilidade de chave: um banco A quer transferir a chave para o banco B. Sem lock distribuído (Redlock), duas requisições simultâneas podem resultar em estado inconsistente onde o dinheiro vai para o banco errado.',
      },
      {
        id: 'q4',
        question: 'Por que não se pode confiar apenas em cache para dados do DICT?',
        options: [
          { label: 'A', text: 'Porque Redis é muito caro' },
          { label: 'B', text: 'Porque o cache pode estar desatualizado após portabilidade — e um PIX enviado para o ISPB errado não volta' },
          { label: 'C', text: 'Porque o BCB bloqueia cache' },
          { label: 'D', text: 'Porque MongoDB é mais rápido que Redis' },
        ],
        correct: 1,
        explanation: 'Se o cache tiver dados antigos (banco de origem antes da portabilidade), um PIX pode ser enviado para o banco errado. O dinheiro vai para uma conta que não existe mais naquele banco, o pacs.002 volta RJCT, e o cliente fica sem o dinheiro por horas. Cache precisa de TTL curto e estratégia de write-through.',
      },
      {
        id: 'q5',
        question: 'Quais são os 4 tipos de chave PIX suportados pelo DICT?',
        options: [
          { label: 'A', text: 'CPF, CNPJ, e-mail, telefone' },
          { label: 'B', text: 'CPF/CNPJ, e-mail, telefone, chave aleatória (UUID)' },
          { label: 'C', text: 'CPF, e-mail, telefone, número da conta' },
          { label: 'D', text: 'CPF, CNPJ, e-mail, chave aleatória' },
        ],
        correct: 1,
        explanation: 'Os 4 tipos são: CPF/CNPJ (documento), e-mail, telefone (+55), e chave aleatória (UUID v4). A chave aleatória é a mais segura porque não expõe nenhum dado pessoal e é recomendada para recebimentos públicos.',
      },
    ],
  },
]
