# Aula 14: Structs, impl blocks e Closures

**Duração:** 45 minutos
**Objetivo:** Organizar código com structs e usar padrões funcionais.

---

## 📋 Objetivos

1. Criar structs com métodos
2. Usar associated functions
3. Trabalhar com closures
4. Usar iterators

---

## 1. Structs e Métodos

```rust
struct Transacao {
    id: String,
    valor: f64,
    status: String,
}

impl Transacao {
    fn nova(id: &str, valor: f64) -> Self {
        Transacao {
            id: id.to_string(),
            valor,
            status: "PENDENTE".into(),
        }
    }

    fn confirmar(&mut self) {
        self.status = "CONFIRMADA".into();
    }

    fn cancelar(&mut self, motivo: &str) {
        self.status = format!("CANCELADA: {}", motivo);
    }
}
```

---

## 2. Closures

```rust
fn main() {
    let multiplicador = 1.5;

    // Closure que captura variável externa
    let calcular = |valor: f64| valor * multiplicador;

    println!("R$ 100 -> R$ {:.2}", calcular(100.0)); // 150.0

    // Closure como filtro
    let valores = vec![10.0, 20.0, 5.0, 30.0, 15.0];
    let grandes: Vec<f64> = valores.iter()
        .filter(|&&v| v > 15.0)
        .copied()
        .collect();

    println!("Grandes: {:?}", grandes); // [20.0, 30.0]
}
```

---

## 3. Iterators

```rust
struct Carrinho {
    itens: Vec<(String, f64)>,
}

impl Carrinho {
    fn total(&self) -> f64 {
        self.itens.iter().map(|(_, preco)| preco).sum()
    }

    fn item_mais_caro(&self) -> Option<(&str, f64)> {
        self.itens.iter()
            .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
            .map(|(nome, preco)| (nome.as_str(), *preco))
    }

    fn filtrar_por_preco(&self, min: f64, max: f64) -> Vec<&(String, f64)> {
        self.itens.iter()
            .filter(|(_, preco)| *preco >= min && *preco <= max)
            .collect()
    }
}

fn main() {
    let carrinho = Carrinho {
        itens: vec![
            ("Notebook".into(), 5000.0),
            ("Mouse".into(), 50.0),
            ("Teclado".into(), 200.0),
        ],
    };

    println!("Total: R$ {:.2}", carrinho.total());
    println!("Mais caro: {:?}", carrinho.item_mais_caro());
}
```

---

**Próxima aula:** [Async/Await com Tokio](./15-async-rust.md)
