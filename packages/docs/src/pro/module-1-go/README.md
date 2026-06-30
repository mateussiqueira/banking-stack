# 🐹 Módulo 1: Concorrência e Alta Performance com Go

> Go é a linguagem que move a infraestrutura em nuvem moderna. Neste módulo, você aprenderá a escalar microsserviços financeiros para suportar milhões de requisições.

## Aulas

| # | Aula | Status | Duração |
|---|------|--------|---------|
| 01 | Introdução a Go para Engenheiros Financeiros | ⏳ Pendente | 45min |
| 02 | Goroutines — Concorrência Real vs Paralelismo | ⏳ Pendente | 60min |
| 03 | Channels — Comunicação Segura entre Goroutines | ⏳ Pendente | 50min |
| 04 | Pacote sync — Mutex, RWMutex, WaitGroup | ⏳ Pendente | 55min |
| 05 | Context — Cancelamento e Timeout em Go | ⏳ Pendente | 40min |
| 06 | gRPC com Go — Proto definitions e streaming | ⏳ Pendente | 65min |
| 07 | Otimização do Garbage Collector | ⏳ Pendente | 50min |
| 08 | Profiling com pprof — CPU, Memory, Goroutines | ⏳ Pendente | 45min |
| 09 | Testes de Carga com k6 em Go | ⏳ Pendente | 55min |
| 10 | Go em Produção — Graceful Shutdown, Health Checks | ⏳ Pendente | 50min |

## Desafios Práticos

| # | Desafio | Baseado em | Status |
|---|---------|------------|--------|
| 01 | SPI Simulator em Go | Challenge 02 (Node.js) | ⏳ Pendente |
| 02 | DICT Simulator em Go | Challenge 03 (Node.js) | ⏳ Pendente |
| 03 | Ledger Contábil em Go | Challenge 01 (Node.js) | ⏳ Pendente |

## Tópicos Chave

### Goroutines e Channels Avançados
- Como estruturar um motor de concorrência resiliente para processamento assíncrono de transações
- Padrões: Fan-out/Fan-in, Pipeline, Worker Pool
- Selecionando múltiplos channels com `select`

### Comunicação de Baixa Latência com gRPC
- Substituindo REST/JSON por buffers binários (Protocol Buffers)
- Streaming unidirecional e bidirecional
- Load balancing e interceptors

### Gerenciamento de Estado Sincronizado
- Evitando race conditions com `sync.Mutex` e `sync.RWMutex`
- Atomic operations com `sync/atomic`
- Once para inicialização segura

### Otimização do Garbage Collector
- GOGC, GOMEMLIMIT e debug.SetGCPercent
- Object pooling com `sync.Pool`
- Minimizing allocations em hot paths

## RFCs Relacionados

- [RFC: Credit on top of Pix](/rfc/credit-on-pix.md)
- [RFC: Financial Transaction Monitoring](/rfc/financial-monitoring.md)
