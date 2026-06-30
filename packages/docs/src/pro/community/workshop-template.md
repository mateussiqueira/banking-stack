# Template de Workshop - Banking Stack Pro

## Formato Padrão

| Item | Detalhes |
|------|----------|
| Duração | 2 horas |
| Estrutura | 30min teoria + 90min prática |
| Participantes | 15-25 alunos |
| Plataforma | Discord Voice + Screen Share + Codespace |
| Gravação | Sim, disponível posteriormente |

---

## Temas Sugeridos

### Go para FinTech

| Detalhe | Info |
|---------|------|
| Pré-requisitos | Go básico, conhecimento HTTP |
| Foco | APIs de pagamento, concorrência, performance |
| Exemplo prático | Sistema de transferência bancária |

**Conteúdo:**
- Go routines e channels para transações paralelas
- gRPC para microsserviços financeiros
- Tratamento de erros em sistemas críticos
- Testes e benchmarks

### Rust para Sistemas Financeiros

| Detalhe | Info |
|---------|------|
| Pré-requisitos | Programação em qualquer linguagem |
| Foco | Segurança, performance, memória |
| Exemplo prático | Parser de transações financeiras |

**Conteúdo:**
- Ownership e borrow checker
- Tratamento de erros com Result
- Serialização com serde
- Concorrência segura

### Kafka para Eventos Financeiros

| Detalhe | Info |
|---------|------|
| Pré-requisitos | Conhecimento de APIs, SQL básico |
| Foco | Event sourcing, messaging, streaming |
| Exemplo prático | Sistema de notificações bancárias |

**Conteúdo:**
- Conceitos de event sourcing
- Producers e consumers
- Particionamento e replay
- Dead letter queues

### Microsserviços na Prática

| Detalhe | Info |
|---------|------|
| Pré-requisitos | APIs REST, Docker básico |
| Foco | Arquitetura, comunicação, deploy |
| Exemplo prático | Split de monolito em serviços |

**Conteúdo:**
- Domain-Driven Design
- API Gateway pattern
- Service mesh com Istio
- Observabilidade

### Segurança em APIs Bancárias

| Detalhe | Info |
|---------|------|
| Pré-requisitos | APIs REST, autenticação básica |
| Foco | OWASP, criptografia, compliance |
| Exemplo prático | OAuth2 + JWT implementation |

**Conteúdo:**
- Autenticação e autorização
- Criptografia de dados sensíveis
- Rate limiting e proteção contra fraudes
- Auditoria e logs

---

## Estrutura Detalhada

### Parte 1: Teoria (30 minutos)

#### 0:00 - 0:05 | Abertura
- Apresentação do instrutor
- Agenda do workshop
- Objetivos de aprendizado

#### 0:05 - 0:25 | Conceitos
- Introdução ao tema
- Por que é relevante para banking
- Conceitos fundamentais
- Casos de uso reais

#### 0:25 - 0:30 | Perguntas
- Dúvidas sobre a teoria
- Transição para prática

### Parte 2: Prática (90 minutos)

#### 0:30 - 0:45 | Setup
- Configuração do ambiente
- Clone do repositório
- Verificação de que tudo funciona

#### 0:45 - 1:15 | Exercício 1
- Implementação guiada
- Instrutor demonstra, alunos copiam
- Pausas para dúvidas

#### 1:15 - 1:30 | Perguntas e Coffee Break
- Dúvidas sobre exercício 1
- Pausa rápida

#### 1:30 - 1:50 | Exercício 2
- Exercício mais desafiador
- Alunos trabalham, instrutor auxilia
- Compartilhamento de soluções

#### 1:50 - 2:00 | Wrap-up
- Revisão do que foi aprendido
- Recursos para continuar estudando
- Feedback e próximos passos

---

## Material do Workshop

### Antes do Workshop

**Alunos recebem:**
- Email com link do repositório
- Instruções de setup
- Pré-requisitos e leituras

**Repositório deve conter:**
```
workshop-[tema]/
├── README.md           # Instruções e objetivos
├── setup.sh           # Script de setup
├── examples/          # Código exemplo
├── exercises/         # Exercícios para os alunos
│   ├── exercise-1/
│   └── exercise-2/
├── solutions/         # Soluções (após workshop)
└── resources.md       # Links e leituras
```

### Durante o Workshop

**Apresentação (Slides):**
- Máximo 20 slides
- Código > texto
- Diagramas claros
- Exemplos práticos

**Código:**
- Comentários explicativos
- Variáveis com nomes claros
- Funções pequenas e documentadas

### Após o Workshop

**Alunos recebem:**
- Gravação do workshop
- Slides atualizados
- Soluções dos exercícios
- Certificado de participação

---

## Checklist do Instrutor

### 2 Semanas Antes

- [ ] Confirmar data e horário
- [ ] Criar repositório no GitHub
- [ ] Preparar slides
- [ ] Testar exercícios completos
- [ ] Definir materiais de apoio

### 1 Semana Antes

- [ ] Enviar email para participantes
- [ ] Verificar inscrições
- [ ] Testar ambiente (Discord, Codespace)
- [ ] Preparar backup do código

### Dia Antes

- [ ] Última revisão dos slides
- [ ] Testar gravação
- [ ] Confirmar horário com alunos
- [ ] Preparar energia e café

### Durante o Workshop

- [ ] Gravar a sessão
- [ ] Monitorar chat para dúvidas
- [ ] Fazer pausas regulares
- [ ] Acompanhar progresso dos alunos

### Depois do Workshop

- [ ] Enviar materiais para alunos
- [ ] Publicar gravação
- [ ] Coletar feedback
- [ ] Agradecer participação

---

## Template de Feedback

### Para o Aluno

```
**Workshop**: [Nome]
**Data**: [Data]
**Instrutor**: [Nome]

1. Conteúdo foi útil? (1-5): __
2. Ritmo adequado? (1-5): __
3. Exercícios práticos? (1-5): __
4. Material claro? (1-5): __
5. Comentários adicionais: 
```

### Para o Instrutor

```
**Workshop**: [Nome]
**Participantes**: Número
**Duração real**: [Tempo]

**O que funcionou**:
- 

**O que melhorar**:
- 

**Ações para próxima vez**:
- 
```

---

## Certificado

### Modelo

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              BANKING STACK PRO                          │
│              Certificado de Participação                │
│                                                         │
│  Certificamos que                                       │
│                                                         │
│                  [NOME DO ALUNO]                        │
│                                                         │
│  participou com sucesso do workshop                     │
│                                                         │
│            "[NOME DO WORKSHOP]"                         │
│                                                         │
│  Data: [DATA]                                           │
│  Carga horária: 2 horas                                 │
│                                                         │
│                                                         │
│  _______________________    _______________________     │
│  Instrutor                  Organização                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Geração

- Usar Canva ou Figma para design
- Gerar PDF com dados do aluno
- Enviar por email após workshop

---

## Repositório Padrão

### README.md

```markdown
# Workshop: [Nome]

## Objetivos
- [ ] Objetivo 1
- [ ] Objetivo 2
- [ ] Objetivo 3

## Pré-requisitos
- [Requisito 1]
- [Requisito 2]

## Setup
1. Clone o repositório
2. Rode `./setup.sh`
3. Verifique com `make test`

## Estrutura
- `examples/` - Código exemplo
- `exercises/` - Exercícios
- `solutions/` - Soluções (depois do workshop)

## Participantes
| Nome | GitHub |
|------|--------|
|      |        |

## Feedback
Após o workshop, preencha: [Formulário](link)
```

---

## Exemplo de Workshop Completo

### Go para FinTech - Sistema de Transferência

**Slides:**
1. Introdução a Go para banking
2. Por que Go? Performance e simplicidade
3. Estrutura do projeto
4. Exercício 1: API REST básica
5. Exercício 2: Transações com banco
6. Próximos passos

**Exercício 1: API REST**
```go
// Criar endpoint POST /transfer
// Receber: {from, to, amount}
// Validar: saldo, limite, fraud check
// Responder: {id, status, timestamp}
```

**Exercício 2: Banco de Dados**
```go
// Implementar repository pattern
// Usar PostgreSQL com pgx
// Transações ACID
// Tratamento de erros
```

---

*Última atualização: Janeiro 2026*
