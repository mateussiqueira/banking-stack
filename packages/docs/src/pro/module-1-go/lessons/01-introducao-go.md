# Aula 01: Introdução a Go para Engenheiros Financeiros

**Duração:** 45 minutos
**Pré-requisitos:** Nenhum
**Objetivo:** Entender por que Go é a linguagem escolhida para infraestrutura financeira e configurar o ambiente de desenvolvimento.

---

## 📋 Objetivos de Aprendizagem

Ao final desta aula, você será capaz de:

1. Explicar por que Go é usado por fintechs e bancos centrais
2. Instalar e configurar o ambiente Go
3. Escrever, compilar e rodar um programa Go
4. Entender os tipos básicos e variáveis em Go
5. Criar funções simples

---

## 1. Por que Go para FinTech?

### O problema da latência nos sistemas financeiros

No mercado financeiro brasileiro, o tempo de resposta é crítico:

| Sistema | Latência Máxima Aceitável | Exemplo |
|---------|--------------------------|---------|
| PIX | 10 segundos | Transferência instantânea |
| SPI | 2 segundos | Liquidação interbancária |
| HFT | Microssegundos | High-Frequency Trading |
| B3 | Milissegundos | Bolsa de valores |

### Go resolve isso porque:

**1. Compilação para binário nativo**
```go
// Go compila para binário - sem runtime, sem JVM, sem interpretação
// Resultado: startup em milissegundos, memória previsível
```

**2. Concorrência nativa (Goroutines)**
```go
// Milhares de goroutines = milhares de transações simultâneas
// Cada goroutine: ~2KB de memória (vs 1MB+ por thread)
```

**3. Garbage Collector de baixa latência**
```go
// Pausas de GC: < 1ms (vs 100ms+ em Java/C#)
// Crítico para sistemas que não podem parar
```

**4. Estáticamente tipado**
```go
// Erros de tipo detectados em compile-time
// Menos bugs em produção = menos prejuízo
```

### Quem usa Go no mercado financeiro?

| Empresa | Uso |
|---------|-----|
| **Banco Central do Brasil** | Infraestrutura SPI/PIX |
| **Nubank** | Microserviços backend |
| **Mercado Pago** | Processamento de pagamentos |
| **Stone** | Gateway de pagamentos |
| **Google** | Kubernetes, Docker (infraestrutura) |
| **Cloudflare** | Edge computing, firewalls |

> 💡 **Dado relevante:** 71% dos engenheiros do Banco Central do Brasil usam Go em produção (Fonte: BCB Tech Talk 2024)

---

## 2. Instalação do Ambiente

### Mac (macOS)

```bash
# Via Homebrew (recomendado)
brew install go

# Verificar instalação
go version
# Saída esperada: go version go1.22.x darwin/arm64
```

### Linux (Ubuntu/Debian)

```bash
# Download da versão estable
wget https://go.dev/dl/go1.22.4.linux-amd64.tar.gz

# Extrair para /usr/local
sudo tar -C /usr/local -xzf go1.22.4.linux-amd64.tar.gz

# Adicionar ao PATH (adicionar ao ~/.bashrc ou ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin

# Verificar
go version
```

### Windows

```bash
# Download do instalador em: https://go.dev/dl/
# Ou via Chocolatey:
choco install golang
```

### Configurar GOPATH

```bash
# Criar diretório de trabalho
mkdir -p ~/go/src/github.com/seu-usuario

# Verificar configuração
go env GOPATH
# Saída: /Users/Apple/go (ou similar)
```

### Verificar instalação completa

```bash
# Criar primeiro projeto
mkdir -p ~/go/src/hello
cd ~/go/src/hello

# Criar arquivo
cat > main.go << 'EOF'
package main

import "fmt"

func main() {
    fmt.Println("Hello, Banking Stack!")
}
EOF

# Rodar
go run main.go
# Saída: Hello, Banking Stack!
```

---

## 3. Estrutura de um Programa Go

### Anatomia básica

```go
// 1. Declaração do pacote (obrigatório)
package main

// 2. Imports (bibliotecas)
import "fmt"

// 3. Função main (ponto de entrada)
func main() {
    // 4. Código
    fmt.Println("Hello, World!")
}
```

### Regras importantes

| Regra | Exemplo |
|-------|---------|
| Todo arquivo começa com `package` | `package main` |
| `main` é o pacote executável | `package main` |
| `import` carrega bibliotecas | `import "fmt"` |
| `func` declara funções | `func main() {}` |
| `{` e `}` definem blocos | `func main() { ... }` |
| Não usar `;` no final das linhas | `fmt.Println("hi")` |
| Variáveis são declaradas com `var` ou `:=` | `var x int` ou `x := 10` |

---

## 4. Variáveis e Tipos

### Declaração de variáveis

```go
// Forma explícita
var nome string = "João"
var idade int = 30
var saldo float64 = 1500.50
var ativo bool = true

// Forma curta (inferência de tipo)
nome := "João"
idade := 30
saldo := 1500.50
ativo := true

// Múltiplas declarações
var (
    nome   string  = "Banco do Brasil"
    ispb   string  = "00000000"
    saldo  float64 = 1000000.00
)
```

### Tipos primitivos

```go
// Inteiros
var i int = 42          // 64 bits (plataforma)
var i32 int32 = 42      // 32 bits
var i64 int64 = 42      // 64 bits
var u uint = 42         // sem sinal

// Ponto flutuante
var f32 float32 = 3.14  // 32 bits
var f64 float64 = 3.14  // 64 bits (RECOMENDADO)

// Strings
var s string = "Hello"

// Booleanos
var b bool = true

// Byte (alias para uint8)
var by byte = 'A'

// Rune (alias para int32 - caractere Unicode)
var r rune = '★'
```

### ⚠️ Atenção: Float para dinheiro

```go
// ERRADO - usar float para dinheiro
var saldo float64 = 0.1 + 0.2
fmt.Println(saldo) // 0.30000000000000004 (erro de precisão!)

// CORRETO - usar inteiros (centavos)
var saldoCentavos int64 = 10 + 20  // R$ 0,10 + R$ 0,20 = R$ 0,30
fmt.Println(saldoCentavos) // 30 (correto!)
```

---

## 5. Funções

### Sintaxe básica

```go
// Função sem retorno
func saudar(nome string) {
    fmt.Println("Olá,", nome)
}

// Função com retorno
func somar(a int, b int) int {
    return a + b
}

// Função com múltiplos retornos (idiomático em Go)
func dividir(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("divisão por zero")
    }
    return a / b, nil
}

// Função com retorno nomeado
func calcularImposto(valor float64) (imposto float64, err error) {
    if valor < 0 {
        return 0, fmt.Errorf("valor não pode ser negativo")
    }
    imposto = valor * 0.15
    return // retorno explícito não necessário
}
```

### Usando funções

```go
func main() {
    // Chamar função
    saudar("Mateus")
    
    // Usar retorno
    resultado := somar(10, 20)
    fmt.Println("Soma:", resultado)
    
    // Múltiplos retornos
    resultado, err := dividir(10, 3)
    if err != nil {
        fmt.Println("Erro:", err)
    } else {
        fmt.Println("Divisão:", resultado)
    }
}
```

---

## 6. Exercício Prático: Hello SPI

### Objetivo

Criar um programa que simula uma mensagem simples do SPI (Sistema de Pagamentos Instantâneos).

### Requisitos

1. Criar variáveis para:
   - EndToEndID (string)
   - Valor (float64)
   - ISPB Origem (string)
   - ISPB Destino (string)

2. Criar uma função `formatarMensagem` que:
   - Receba as variáveis
   - Retorne uma string formatada

3. Imprimir a mensagem formatada

### Solução esperada

```go
package main

import "fmt"

// Struct para representar uma transação SPI
type TransacaoSPI struct {
    EndToEndID  string
    Valor       float64
    ISPBOrigem  string
    ISPBDestino string
    Status      string
}

// Função para formatar mensagem
func formatarMensagem(t TransacaoSPI) string {
    return fmt.Sprintf(
        "[SPI] E2E: %s | R$ %.2f | %s → %s | Status: %s",
        t.EndToEndID,
        t.Valor,
        t.ISPBOrigem,
        t.ISPBDestino,
        t.Status,
    )
}

func main() {
    // Criar transação
    tx := TransacaoSPI{
        EndToEndID:  "E2E20240101120000ABC12345",
        Valor:       150.50,
        ISPBOrigem:  "00000000", // Banco do Brasil
        ISPBDestino: "60701190", // Itaú BBA
        Status:      "ACCEPTED",
    }

    // Imprimir mensagem
    fmt.Println(formatarMensagem(tx))
    
    // Saída esperada:
    // [SPI] E2E: E2E20240101120000ABC12345 | R$ 150.50 | 00000000 → 60701190 | Status: ACCEPTED
}
```

### Execute

```bash
go run main.go
```

---

## 7. Resumo da Aula

### Conceitos aprendidos

| Conceito | Exemplo |
|----------|---------|
| Pacote | `package main` |
| Import | `import "fmt"` |
| Variável | `var x int = 10` ou `x := 10` |
| Constante | `const Pi = 3.14` |
| Função | `func somar(a, b int) int` |
| Struct | `type Conta struct { Nome string }` |
| Print | `fmt.Println("texto")` |
| Formatação | `fmt.Sprintf("R$ %.2f", valor)` |

### Por que isso importa em FinTech?

1. **Tipagem estática** → menos erros em produção
2. **Compilação rápida** → deploy mais rápido
3. **Binário nativo** → performance máxima
4. **Goroutines** → alta concorrência (próxima aula)

---

## 8. Próximos Passos

### Aula 02: Goroutines — Concorrência Real vs Paralelismo

Na próxima aula, você aprenderá:
- O que são goroutines
- Diferença entre concorrência e paralelismo
- Como criar milhares de goroutines
- Por que isso é crítico para sistemas financeiros

### Desafio para casa

Modifique o exercício para:
1. Criar uma função `validarISPB` que verifique se o ISPB tem 8 dígitos
2. Retornar erro se inválido
3. Tratar o erro na main

---

## 📚 Recursos Adicionais

- [Go Tour (oficial)](https://go.dev/tour/)
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Documentação Go](https://go.dev/doc/)

---

**Próxima aula:** [Goroutines — Concorrência Real vs Paralelismo](./02-goroutines.md)
