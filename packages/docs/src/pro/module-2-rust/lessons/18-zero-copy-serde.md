# Aula 18: Zero-Copy com Serde

**Duração:** 65 minutos
**Objetivo:** Processar mensagens financeiras sem alocações de memória.

---

## 📋 Objetivos

1. Entender zero-copy deserialization
2. Usar serde com borrowed data
3. Parsear ISO 8583 sem alocação
4. Comparar com Go

---

## 1. Zero-Copy vs Alocação

```rust
// COM alocação (copia dados)
#[derive(Deserialize)]
struct MensagemAlocada {
    id: String,        // String = heap allocation
    dados: Vec<u8>,    // Vec = heap allocation
}

// ZERO-COPY (empresta dados)
#[derive(Deserialize)]
struct MensagemZeroCopy<'a> {
    id: &'a str,           // &str = reference, sem cópia
    dados: &'a [u8],       // &[u8] = reference, sem cópia
}
```

---

## 2. Serde com Borrowed Data

```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct Transaction<'a> {
    #[serde(borrow)]
    end_to_end_id: &'a str,
    amount: f64,
    #[serde(borrow)]
    creditor_ispb: &'a str,
}

fn main() {
    let json = r#"{
        "end_to_end_id": "E2E20240101120000TEST",
        "amount": 250.50,
        "creditor_ispb": "60701190"
    }"#;

    // Zero-copy: &json continua válido
    let tx: Transaction = serde_json::from_str(json).unwrap();
    println!("{:?}", tx);
    println!("Original: {}", json); // Ainda acessível!
}
```

---

## 3. ISO 8583 Parser

```rust
#[derive(Debug)]
struct ISO8583<'a> {
    mti: &'a [u8; 4],
    bitmap: &'a [u8; 16],
    fields: Vec<(&'a [u8], usize)>,
}

impl<'a> ISO8583<'a> {
    fn parse(data: &'a [u8]) -> Self {
        let mti: &[u8; 4] = data[0..4].try_into().unwrap();
        let bitmap: &[u8; 16] = data[4..20].try_into().unwrap();

        let mut fields = Vec::new();
        let mut offset = 20;

        for i in 0..128 {
            if bitmap[i / 8] & (1 << (7 - (i % 8))) != 0 {
                if offset + 2 <= data.len() {
                    let len = u16::from_be_bytes([
                        data[offset], data[offset + 1]
                    ]) as usize;
                    offset += 2;

                    if offset + len <= data.len() {
                        fields.push((&data[offset..offset + len], i + 1));
                        offset += len;
                    }
                }
            }
        }

        ISO8583 { mti, bitmap, fields }
    }
}
```

---

## 4. Comparação Go vs Rust

```go
// Go: sempre aloca
func parseISO8583(data []byte) Message {
    msg := Message{} // Nova alocação
    json.Unmarshal(data, &msg)
    return msg
}
```

```rust
// Rust: zero-copy
fn parse_iso8583<'a>(data: &'a [u8]) -> ISO8583<'a> {
    ISO8583::parse(data) // Sem alocação!
}
```

---

**Próxima aula:** [WebSockets](./19-websockets.md)
