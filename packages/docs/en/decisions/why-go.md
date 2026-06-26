# Why Go?

The question everyone asks: "why didn't you stick with Node.js?"

Short answer: because in financial systems, predictability matters more than convenience.

## The SPI Simulator case

The SPI Simulator is the perfect example. It receives XML, validates, processes, and responds. Seems simple. But when you're processing 10,000 transactions per second, "simple" becomes "critical".

### Node.js worked

Let's not lie. The TypeScript version worked. It passed tests. It responded to requests.

But:

```typescript
// 50ms average latency
// 50MB memory usage
// Unpredictable garbage collection
// 2K requests/second
```

### Go solves it

```go
// 0.2ms average latency
// 10MB memory usage
// Deterministic memory management
// 50K requests/second
```

The difference isn't just speed. It's reliability.

## When to use Go

Go makes sense when:

1. **Latency matters** — financial systems, gaming, trading
2. **CPU is the bottleneck** — data processing, cryptography, parsing
3. **Memory is limited** — containers, edge computing, IoT
4. **Concurrency is heavy** — thousands of simultaneous connections

## When NOT to use Go

Go doesn't make sense when:

1. **Development speed is priority** — prototypes, MVPs
2. **Library ecosystem is important** — machine learning, data science
3. **Runtime flexibility is needed** — hot reload, REPL
4. **Team doesn't know Go** — learning curve exists

## The decision

In banking-stack, the decision was:

| Service | Language | Why |
|---------|----------|-----|
| SPI Simulator | Go | Critical latency, XML parsing |
| DICT Simulator | Go | Concurrent access, validation |
| ISO 8583 | TypeScript | Binary protocol, too complex |
| Workflow Engine | TypeScript | Business logic, flexibility |
| Leaky Bucket | TypeScript | Redis integration, GraphQL |

The rule is simple: **if the system processes money, use Go. If the system processes data, use TypeScript.**

## References

- [Go vs Node.js for microservices](https://blog.logrocket.com/go-vs-node-js/)
- [Why Uber switched to Go](https://www.uber.com/blog/microservice-architecture/)
- [ISO 20022 migration](https://www.bcb.gov.br/estabilidadefinanceira/iso20022)
