# Preview: Por que Rust? 🦀

**Módulo 2 — Sistemas de Missão Crítica**

---

## O problema que Go não resolve

Go é excelente para a maioria dos casos, mas existem cenários onde ele atinge seus limites:

| Limitação | Impacto em FinTech |
|-----------|-------------------|
| **Garbage Collector** | Pausas de ~1ms inaceitáveis em HFT |
| **Memory safety** | Vulnerabilidades de buffer overflow |
| **Zero-cost abstractions** | Overhead em hot paths críticos |

---

## Quando usar Rust?

```
Go:  "Bom para 95% dos casos"
Rust: "Os 5% restantes onde cada nanosegundo conta"
```

### Casos de uso em FinTech

| Caso | Por que Rust |
|------|--------------|
| **Order Book (Matching Engine)** | Lock-free, zero-copy, microssegundos |
| **Risk Engine** | Cálculos matemáticos precisos, sem GC |
| **FIX Protocol Parser** | Deserialização binária zero-allocation |
| **High-Frequency Trading** | Latência determinística |
| **Cryptographic Operations** | Memory safety sem overhead |

---

## Rust vs Go: Comparação

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Característica  │      Go         │     Rust        │
├─────────────────┼─────────────────┼─────────────────┤
│ GC              │ Sim (<1ms)      │ Não (zero)      │
│ Memory Safety   │ Runtime         │ Compile-time    │
│ Concorrência    │ Goroutines      │ async/await     │
│ Performance     │ Alta            │ Máxima          │
│ Curva aprendiz. │ Fácil           │ Íngreme         │
│ Produtividade   │ Alta            │ Média           │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## O que você vai aprender no Módulo 2

### Aula 11-14: Fundação Rust
- Ownership & Borrow Checker
- Pattern Matching
- Traits & Generics
- Structs & Closures

### Aula 15-18: Async Rust
- Tokio Runtime
- HTTP com Axum
- Zero-Copy com Serde
- WebSockets para cotações

### Aula 19-21: Rust em Produção
- FFI e integração
- Deploy e Docker
- Benchmark Go vs Rust

### Desafios Práticos
- ISO 8583 Parser (zero-allocation)
- Order Book Engine (matching engine)

---

## Exemplo: Zero-Copy em Rust

```rust
// Go: aloca memória para cada parse
func parseISO8583(data []byte) Message {
    msg := Message{} // Nova alocação
    json.Unmarshal(data, &msg)
    return msg
}

// Rust: processa direto da memória (zero-copy)
fn parse_iso8583(data: &[u8]) -> Result<Message, Error> {
    let msg: Message = serde_json::from_slice(data)?;
    Ok(msg) // Sem alocação extra!
}
```

---

## Exemplo: Lock-Free Order Book

```rust
use std::sync::atomic::{AtomicU64, Ordering};

struct OrderBook {
    bids: CachePadded<RwLock<BTreeMap<Price, Vec<Order>>>>,
    asks: CachePadded<RwLock<BTreeMap<Price, Vec<Order>>>>,
    volume: AtomicU64,  // Contador atômico
}

impl OrderBook {
    fn match_order(&self, order: &Order) -> Vec<Trade> {
        // Matching engine em microssegundos
        // Sem GC pauses, sem locks desnecessários
    }
}
```

---

## Próximos passos

O Módulo 2 completo incluirá:
- **11 aulas** de Rust
- **2 desafios** práticos (ISO 8583 + Order Book)
- **Benchmarks** Go vs Rust em cenários reais

---

**Preparado para Rust? O Módulo 2 começa em breve! 🦀**
