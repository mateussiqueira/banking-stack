# Aula 11: Rust para Engenheiros — Ownership, Borrowing, Lifetimes

**Duração:** 60 minutos
**Objetivo:** Entender o sistema de ownership do Rust e por que ele elimina GC.

---

## 📋 Objetivos

1. Entender ownership rules
2. Diferenciar move vs clone vs copy
3. Usar borrowing (& e &mut)
4. Entender lifetimes básicas

---

## 1. Ownership — As 3 Regras

```rust
// Regra 1: Cada valor tem um único owner
let s1 = String::from("hello");

// Regra 2: Só pode haver um owner por vez
let s2 = s1; // s1 foi MOVED para s2
// println!("{}", s1); // ❌ ERRO: s1 não existe mais

// Regra 3: Owner sai de escopo → valor é dropado
{
    let s3 = String::from("world");
    // s3 está vivo aqui
}
// s3 foi dropado aqui
```

---

## 2. Move vs Clone vs Copy

```rust
// MOVE: transferência de ownership
let a = String::from("hello");
let b = a; // a foi moved para b
// a não existe mais

// CLONE: cópia profunda
let c = String::from("hello");
let d = c.clone(); // c e d são independentes
println!("{} {}", c, d); // ✅ funciona

// COPY: cópia barata (tipos com tamanho fixo)
let x: i32 = 42;
let y = x; // i32 implementa Copy
println!("{} {}", x, y); // ✅ funciona
```

---

## 3. Borrowing

```rust
// &T — Referência imutáuda (pode ter múltiplas)
fn calcular_total(preco: &Vec<f64>) -> f64 {
    preco.iter().sum()
}

let precos = vec![10.0, 20.0, 30.0];
let total = calcular_total(&precos); // empresta
println!("Total: {}", total);

// &mut T — Referência mutável (só uma por vez)
fn adicionar_item(carrinho: &mut Vec<String>, item: &str) {
    carrinho.push(item.to_string());
}

let mut carrinho = vec![];
adicionar_item(&mut carrinho, "Pixel 8");
```

---

## 4. Lifetimes

```rust
// Lifetime evita dangling references
fn primeira<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

let resultado;
let s1 = String::from("longo");
{
    let s2 = String::from("x");
    resultado = primeira(&s1, &s2);
}
// println!("{}", resultado); // ❌ s2 já foi dropado
```

---

## 5. Exercício: Ownership Bank Account

```rust
struct Conta {
    titular: String,
    saldo: f64,
}

impl Conta {
    fn new(titular: &str, saldo: f64) -> Self {
        Conta { titular: titular.to_string(), saldo }
    }

    fn transferir(&mut self, destino: &mut Conta, valor: f64) -> Result<(), String> {
        if self.saldo < valor {
            return Err("Saldo insuficiente".into());
        }
        self.saldo -= valor;
        destino.saldo += valor;
        Ok(())
    }
}

fn main() {
    let mut alice = Conta::new("Alice", 1000.0);
    let mut bob = Conta::new("Bob", 500.0);

    alice.transferir(&mut bob, 200.0).unwrap();

    println!("Alice: R$ {:.2}", alice.saldo);   // 800
    println!("Bob: R$ {:.2}", bob.saldo);        // 700
}
```

---

**Próxima aula:** [Enums e Pattern Matching](./12-enums-pattern-matching.md)
