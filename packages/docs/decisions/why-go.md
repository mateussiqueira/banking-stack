# Por que Go?

A pergunta que todo mundo faz: "por que não ficou com Node.js?"

A resposta curta: porque em sistemas financeiros, previsibilidade importa mais que conveniência.

## O caso do SPI Simulator

O SPI Simulator é o melhor exemplo. Ele recebe XML, valida, processa e responde. Parece simples. Mas quando você processa 10 mil transações por segundo, "simples" vira "crítico".

### Node.js funcionava

Não vamos mentir. A versão em TypeScript funcionava. Passava nos testes. Respondia requests.

Mas:

```typescript
// 50ms de latência média
// 50MB de memória
// Garbage collector imprevisível
// 2K requests/segundo
```

### Go resolve

```go
// 0.2ms de latência média
// 10MB de memória
// Memória determinística
// 50K requests/segundo
```

A diferença não é só velocidade. É confiabilidade.

## Quando usar Go

Go faz sentido quando:

1. **Latência importa** — sistemas financeiros, gaming, trading
2. **CPU é o gargalo** — processamento de dados, cryptografia, parsing
3. **Memória é limitada** — containers, edge computing, IoT
4. **Concorrência é pesada** — milhares de conexões simultâneas

## Quando NÃO usar Go

Go não faz sentido quando:

1. **Velocidade de desenvolvimento é prioridade** — protótipos, MVPs
2. **Ecossistema de bibliotecas é importante** — machine learning, data science
3. **Flexibilidade de runtime é necessária** — hot reload, REPL
4. **Time não sabe Go** — learning curve existe

## A decisão

No banking-stack, a decisão foi:

| Serviço | Linguagem | Por quê |
|---------|-----------|---------|
| SPI Simulator | Go | Latência crítica, XML parsing |
| DICT Simulator | Go | Concurrent access, validation |
| ISO 8583 | TypeScript | Binary protocol, complexo demais |
| Workflow Engine | TypeScript | Lógica de negócio, flexibilidade |
| Leaky Bucket | TypeScript | Redis integration, GraphQL |

A regra é simples: **se o sistema processa dinheiro, usa Go. Se o sistema processa dados, usa TypeScript.**

## Referências

- [Go vs Node.js for microservices](https://blog.logrocket.com/go-vs-node-js/)
- [Why Uber switched to Go](https://www.uber.com/blog/microservice-architecture/)
- [ISO 20022 migration](https://www.bcb.gov.br/estabilidadefinanceira/iso20022)
