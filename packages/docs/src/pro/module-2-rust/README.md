# 🦀 Módulo 2: Sistemas de Missão Crítica com Rust

> Quando o Garbage Collector de Go se torna um gargalo e o risco de segurança de memória em C++ é inaceitável, o mercado recorre ao Rust.

## Aulas

| # | Aula | Status | Duração |
|---|------|--------|---------|
| 11 | Rust para Engenheiros — Ownership, Borrowing, Lifetimes | ⏳ Pendente | 60min |
| 12 | Enums, Pattern Matching e Error Handling Result<T, E> | ⏳ Pendente | 50min |
| 13 | Traits e Generics — Polimorfismo estático | ⏳ Pendente | 55min |
| 14 | Structs, impl blocks e closures | ⏳ Pendente | 45min |
| 15 | Async/Await em Rust — Futures e executors | ⏳ Pendente | 60min |
| 16 | Tokio Runtime — Spawn, Channels, Timer | ⏳ Pendente | 55min |
| 17 | HTTP com Axum ou Actix-web | ⏳ Pendente | 50min |
| 18 | Zero-Copy com serde — Processamento de ISO 8583 | ⏳ Pendente | 65min |
| 19 | WebSockets em Rust para cotações em tempo real | ⏳ Pendente | 50min |
| 20 | FFI e integração com bibliotecas C | ⏳ Pendente | 45min |
| 21 | Deploy de serviços Rust — Docker, systemd, performance | ⏳ Pendente | 40min |

## Desafios Práticos

| # | Desafio | Baseado em | Status |
|---|---------|------------|--------|
| 04 | ISO 8583 Parser em Rust (zero-allocation) | Challenge 04 (Node.js) | ⏳ Pendente |
| 05 | Order Book Engine em Rust (matching engine) | Novo desafio | ⏳ Pendente |

## Tópicos Chave

### Ownership & Borrow Checker
- Segurança de memória em tempo de compilação sem perda de performance
- Move semantics vs Copy semantics
- Referências mutáveis vs imutáveis

### Async Rust com Tokio
- Runtimes assíncronos de alta performance
- Conexões persistentes massivas (WebSockets para cotações)
- Spawn, select!, e channels assíncronos

### Zero-Copy Deserialization
- Processar payloads financeiros complexos (ISO 8583, FIX Protocol)
- Sem alocações desnecessárias na memória
- Serde + ZeroCopy traits

### Arquitetura de Order Book
- Estruturas de dados otimizadas para matching engine
- BTreeMap para price-time priority
- Lock-free com atomics

## RFCs Relacionados

- [RFC: Data Lake for Fintechs](/rfc/data-lake.md)
