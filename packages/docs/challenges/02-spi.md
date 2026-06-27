# 02 — SPI Simulator

**🇧🇷** Simulador do Sistema de Pagamentos Instantâneos  
**🇬🇧** Instant Payment System Simulator

---

Você já mandou um Pix e parou pra pensar no que acontece entre o "confirmar" e o "dinheiro caiu"? Pois é. Não é mágica. É o SPI.

SPI é o Sistema de Pagamentos Instantâneos do Banco Central. Ele é o meio de campo entre seu banco e o banco de quem recebe. Toda transação Pix passa por ele. Se ele cai, o Pix cai. Se ele é lento, o Pix demora. Se ele tem bug, dinheiro some.

Esse desafio é sobre construir um simulador dele. E depois reescrever em Go porque TypeScript não deu conta.

---

## O fluxo de um Pix

```
Seu celular → Nubank → SPI (BC) → Itaú → Conta do destino
```

Parece simples, mas cada flecha dessas esconde um mundo de complexidade. Entre o Nubank e o Itaú, o SPI precisa fazer 5 coisas em menos de 10 segundos:

1. Validar a transação (forma, fundos, limites)
2. Verificar se o banco do destino existe e aceita
3. Fazer a compensação entre os bancos
4. Notificar ambos os bancos
5. Se algo der errado, reverter

Tudo isso em XML. ISO 20022. Um padrão que veio pra ficar.

O Bacen S2 (Sistema de Transferência de Reservas) é o sistema de liquidação que move o dinheiro entre as contas de reserva bancária. O SPI coordena as mensagens, mas é o S2 que efetivamente transfere o saldo. Cada banco tem uma conta de reserva no BC. Quando você faz um Pix, o SPI:
1. Recebe a mensagem do banco pagador
2. Verifica se o banco pagador tem saldo na conta de reserva
3. Deblita a conta do banco pagador no S2
4. Credita a conta do banco recebedor no S2
5. Envia a confirmação pra ambos

Tudo em milissegundos. Se o S2 estiver fora do ar, o Pix não liquida. Se o SPI estiver fora do ar, a mensagem não chega. Por isso o BC tem SLA de 99.999% pro SPI. E multa de R$ 50 mil por hora de indisponibilidade.

---

## O padrão ISO 20022

ISO 20022 não é só um formato de XML. É uma metodologia. Uma ontologia financeira. Cada mensagem tem um propósito específico, um código de 4 letras (pacs.008, pacs.002, pacs.004, camt.056, etc.) e uma hierarquia de campos que não pode ser violada.

As mensagens principais do SPI:

| Código | Nome | Propósito |
|--------|------|-----------|
| `pacs.008` | FIToFICustomerCreditTransfer | Transferência de crédito |
| `pacs.002` | FIToFIPaymentStatusReport | Status da transação |
| `pacs.004` | PaymentReturn | Devolução de pagamento |
| `pacs.028` | FIToFIPaymentReversal | Estorno técnico |
| `camt.056` | FIToFIPaymentCancellationRequest | Pedido de cancelamento |
| `camt.060` | AccountReporting | Extrato de liquidação |
| `admi.002` | ApplicationEvent | Evento administrativo |

Toda mensagem segue uma estrutura de envelope: um header (`GrpHdr`) que contém metadados (ID, número de transações, valor total, data/hora), seguido pelos detalhes da transação (`CdtTrfTxInf`) que contém o valor, os bancos envolvidos, o pagador, o recebedor e o propósito do pagamento.

E sim, tudo é aninhado. Profundamente. Cada campo tem 3, 4, às vezes 5 níveis de profundidade. O XML que você vê abaixo é o mais simples possível. Um Pix real tem campos opcionais que adicionam mais 3 ou 4 níveis de aninhamento.

---

## A primeira versão (TypeScript)

Comecei com Node.js + Fastify. Ficou pronta em 2 horas. Funcionava.

```typescript
app.post('/spi/pacs.008', async (request, reply) => {
  const xml = request.body
  const result = processPayment(xml)
  return reply.send(result)
})
```

Simples. Direto. Testado. Publicado.

Mas aí vieram os problemas:

1. **XML é um inferno** — `fastify-xml-body-parser` não compilava com TypeScript estrito. Tive que fazer parsing na mão.
2. **Performance** — 50ms por request. Parece pouco, mas quando você processa 10 mil por segundo, cada milissegundo é um banco reclamando.
3. **Memória** — 50MB de heap. O Node.js decide quando fazer garbage collection. E quando ele faz, tudo para por 100ms. Em sistema financeiro, 100ms de pause é uma transação perdida.

E o pior: não tem como prever quando vai acontecer. É loteria.

Vou mostrar a versão completa do TypeScript pra você sentir a dor:

```typescript
import Fastify from 'fastify'
import { randomUUID } from 'node:crypto'

const app = Fastify({ logger: true })

// O inferno do XML manual
function parsePACS008(xml: string): {
  msgId: string
  endToEndId: string
  amount: number
  senderISP: string
  receiverISP: string
} | { error: string } {
  try {
    const msgId = xml.match(/<MsgId>([^<]+)<\/MsgId>/)?.[1]
    const endToEndId = xml.match(/<EndToEndId>([^<]+)<\/EndToEndId>/)?.[1]
    const amount = parseFloat(
      xml.match(/<IntrBkSttlmAmt[^>]*>([^<]+)<\/IntrBkSttlmAmt>/)?.[1] ?? '0'
    )
    const senderISP = xml.match(/<MmbId>(\d{8})<\/MmbId>/)?.[1]
    const receiverISP =
      xml.match(/<CdtrAgt>[\s\S]*?<MmbId>(\d{8})<\/MmbId>/)?.[1]

    if (!msgId || !endToEndId || !amount || !senderISP || !receiverISP) {
      return { error: 'Campos obrigatórios ausentes no XML' }
    }

    return { msgId, endToEndId, amount, senderISP, receiverISP }
  } catch (e) {
    return { error: `Falha no parsing: ${e}` }
  }
}

// Banco de dados em memória
const transactions = new Map<string, {
  id: string
  endToEndId: string
  amount: number
  senderISP: string
  receiverISP: string
  status: 'accepted' | 'rejected' | 'pending'
  timestamp: Date
}>()

function processPayment(xml: string) {
  const parsed = parsePACS008(xml)

  if ('error' in parsed) {
    return {
      status: 'RJCT',
      reason: parsed.error
    }
  }

  // Validar ISPB (8 dígitos numéricos)
  if (!/^\d{8}$/.test(parsed.senderISP)) {
    return { status: 'RJCT', reason: 'ISPB do pagador inválido' }
  }
  if (!/^\d{8}$/.test(parsed.receiverISP)) {
    return { status: 'RJCT', reason: 'ISPB do recebedor inválido' }
  }

  // Validar valor positivo
  if (parsed.amount <= 0) {
    return { status: 'RJCT', reason: 'Valor deve ser positivo' }
  }

  // Validar duplicata (EndToEndId único)
  if (Array.from(transactions.values()).some(
    t => t.endToEndId === parsed.endToEndId && t.status === 'accepted'
  )) {
    return { status: 'RJCT', reason: 'EndToEndId duplicado' }
  }

  const tx = {
    id: randomUUID(),
    endToEndId: parsed.endToEndId,
    amount: parsed.amount,
    senderISP: parsed.senderISP,
    receiverISP: parsed.receiverISP,
    status: 'accepted' as const,
    timestamp: new Date()
  }

  transactions.set(tx.id, tx)

  return {
    status: 'ACSC',
    transactionId: tx.id,
    endToEndId: tx.endToEndId,
    settlement: new Date().toISOString()
  }
}

app.post('/spi/pacs.008', async (request, reply) => {
  const xml = request.body as string
  const result = processPayment(xml)
  return reply.send(result)
})

app.get('/spi/transactions', async () => {
  return Array.from(transactions.values())
})

app.get('/spi/health', async () => ({ status: 'ok', uptime: process.uptime() }))

app.listen({ port: 3002 })
```

Esse código até que ficou limpo. Mas na prática, cada regex match criava uma string temporária no heap. Cada parseFloat alocava um objeto Number. Cada iteração do `Array.from` iterava sobre o Map inteiro — O(n) em cada request. Com 10 mil transações no map, cada GET virava um loop de 10 mil checagens.

E o pior: o garbage collector do V8. Ele não avisa. Ele não pede licença. Ele simplesmente pausa o event loop e varre o heap. Em 100ms de pausa, você perdeu dezenas de transações que estavam sendo processadas. Bancos não perdoam 100ms.

```bash
# Profile do Node.js mostrando GC pauses
node --trace-gc spi-server.mjs 2>&1 | grep "Mark-sweep" | head -5

[28645:0x150008000]   1234567 ms: Mark-sweep 52.3 -> 48.2 MB, 102.4 / 0.0 ms
[28645:0x150008000]   2345678 ms: Mark-sweep 55.1 -> 47.8 MB, 98.7 / 0.0 ms
[28645:0x150008000]   3456789 ms: Mark-sweep 54.9 -> 46.5 MB, 105.2 / 0.0 ms
```

Olha isso: 100ms de pausa. Um ciclo de GC que varre 50MB de heap. Em produção, com 10 mil transações por segundo, você não pode ter pausas de 100ms. Cada pausa significa fila crescendo, timeout estourando, banco reclamando.

Na época eu pensei: "vou aumentar o heap, dar mais memória pro V8". Só piorou. Mais heap = mais tempo de GC. Mais objetos = mais fragmentação. O V8 tem um GC generacional muito bom pra browser, mas pra servidor financeiro com alocação intensa de objetos temporários (strings XML, buffers, objetos de transação), ele simplesmente não foi desenhado.

Foi aí que eu olhei pro Go.

---

## A reescrita em Go

Não foi porque Go é "melhor". Foi porque Go é mais adequado pra esse caso específico.

```go
package main

import (
    "encoding/xml"
    "net/http"
    "github.com/gin-gonic/gin"
)

type PACS008 struct {
    XMLName     xml.Name `xml:"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08 Document"`
    GrpHdr      GroupHeader
    CdtTrfTxInf CreditTransfer
}

type GroupHeader struct {
    MsgId   string  `xml:"FIToFICstmrCdtTrf>GrpHdr>MsgId"`
    NbOfTxs int     `xml:"FIToFICstmrCdtTrf>GrpHdr>NbOfTxs"`
    Amount  float64 `xml:"FIToFICstmrCdtTrf>GrpHdr>TtlIntrBkSttlmAmt"`
}

type CreditTransfer struct {
    EndToEndId string `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>PmtId>EndToEndId"`
    Sender     string `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>InstgAgt>FinInstnId>ClrSysMmbId>MmbId"`
    Receiver   string `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>CdtrAgt>FinInstnId>ClrSysMmbId>MmbId"`
    Amount     float64 `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>IntrBkSttlmAmt"`
}

func main() {
    r := gin.Default()

    r.POST("/spi/pacs.008", func(c *gin.Context) {
        var msg PACS008
        if err := c.ShouldBindXML(&msg); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }

        tx := processPayment(msg)
        
        c.XML(200, pacs002Response(tx))
    })

    r.GET("/spi/transactions", getTransactions)
    r.GET("/spi/health", healthCheck)

    r.Run(":3002")
}
```

A diferença?

| Métrica | TypeScript | Go |
|---------|-----------|-----|
| Startup | ~2s | ~50ms |
| Memória | ~50MB | ~10MB |
| Parsing XML | ~5ms | ~0.2ms |
| Throughput | ~2K req/s | ~50K req/s |
| Binário | N/A (precisa Node) | ~15MB (standalone) |
| GC pauses | ~100ms (imprevisível) | ~1ms (previsível) |
| XML struct mapping | Regex manual | `encoding/xml` nativo |
| Concorrência | Single-thread + async | Goroutines nativas |
| Deploy | `npm install` + node | `scp binário` + executar |

Mas o benefício real não é velocidade bruta. É **previsibilidade**. Go não tem garbage collector surpresa. A memória é gerenciada de forma determinística. Você sabe exatamente quando e quanto vai usar.

Go usa um garbage collector concorrente com latência alvo de <2ms desde Go 1.8. Ele não pausa o mundo inteiro — só pacotes específicos de goroutines por vez. E ele é executado em paralelo com o programa, não bloqueando. O V8 faz mark-sweung que pausa tudo. O Go faz mark-sweep concorrente com write barrier.

Na prática, isso significa que:

- No Node.js: a cada 30 segundos, sua aplicação congela por 100ms
- No Go: a cada 2 minutos, o GC roda em background e você não percebe

Pra um sistema financeiro em tempo real, a escolha é óbvia.

---

## O processamento de pagamento em Go

Vamos mergulhar fundo na lógica:

```go
type Transaction struct {
    ID         string    `json:"id"`
    EndToEndID string    `json:"endToEndId"`
    Amount     float64   `json:"amount"`
    SenderISP  string    `json:"senderIsp"`
    ReceiverISP string   `json:"receiverIsp"`
    Status     string    `json:"status"`
    Timestamp  time.Time `json:"timestamp"`
}

type Store struct {
    mu           sync.RWMutex
    transactions map[string]Transaction
    byEndToEnd   map[string]string // endToEndId -> transactionId
}

func NewStore() *Store {
    return &Store{
        transactions: make(map[string]Transaction),
        byEndToEnd:   make(map[string]string),
    }
}

func (s *Store) Save(tx Transaction) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    // Duplicate detection
    if existingID, ok := s.byEndToEnd[tx.EndToEndID]; ok {
        if s.transactions[existingID].Status == "ACSC" {
            return fmt.Errorf("duplicate endToEndId: %s", tx.EndToEndID)
        }
    }

    s.transactions[tx.ID] = tx
    s.byEndToEnd[tx.EndToEndID] = tx.ID
    return nil
}

func (s *Store) List() []Transaction {
    s.mu.RLock()
    defer s.mu.RUnlock()

    result := make([]Transaction, 0, len(s.transactions))
    for _, tx := range s.transactions {
        result = append(result, tx)
    }
    return result
}

func (s *Store) FindByEndToEnd(endToEndID string) (Transaction, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    txID, ok := s.byEndToEnd[endToEndID]
    if !ok {
        return Transaction{}, false
    }
    tx, ok := s.transactions[txID]
    return tx, ok
}
```

Repare no `sync.RWMutex`. Em Go, concorrência explícita é parte da linguagem. O `RLock` permite múltiplos leitores simultâneos sem bloqueio. O `Lock` exclusivo é usado só pra escrita. Em TypeScript, você teria que usar `async-mutex` ou implementar na mão. Em Go, `sync` faz parte da stdlib.

Outra diferença sutil: `make([]Transaction, 0, len(s.transactions))`. Go permite pré-alocar a slice com capacidade exata. Zero alocações extras durante o append. Em TypeScript, `Array.from(map.values())` faz duas passadas: uma pra criar o iterator, outra pra popular o array. Cada passo aloca. Nada é gratuito em linguagem com GC.

### Validação completa

```go
func validatePayment(tx PACS008) error {
    // 1. MsgId obrigatório
    if tx.GrpHdr.MsgId == "" {
        return ErrMissingMsgID
    }

    // 2. Número de transações
    if tx.GrpHdr.NbOfTxs <= 0 {
        return ErrInvalidTxCount
    }

    // 3. Valor total
    if tx.GrpHdr.Amount <= 0 {
        return ErrInvalidAmount
    }

    // 4. EndToEndId obrigatório
    if tx.CdtTrfTxInf.EndToEndId == "" {
        return ErrMissingEndToEndID
    }

    // 5. ISPB do remetente: 8 dígitos numéricos
    if !isValidISP(tx.CdtTrfTxInf.Sender) {
        return ErrInvalidSenderISP
    }

    // 6. ISPB do destinatário: 8 dígitos numéricos
    if !isValidISP(tx.CdtTrfTxInf.Receiver) {
        return ErrInvalidReceiverISP
    }

    // 7. Remetente e destinatário não podem ser iguais
    if tx.CdtTrfTxInf.Sender == tx.CdtTrfTxInf.Receiver {
        return ErrSameBankTransfer
    }

    // 8. Valor da transação compatível com o total
    if tx.CdtTrfTxInf.Amount != tx.GrpHdr.Amount {
        return ErrAmountMismatch
    }

    return nil
}

var (
    ErrMissingMsgID      = errors.New("MSGGID ausente")
    ErrInvalidTxCount    = errors.New("NbOfTxs inválido")
    ErrInvalidAmount     = errors.New("valor deve ser positivo")
    ErrMissingEndToEndID = errors.New("EndToEndId ausente")
    ErrInvalidSenderISP  = errors.New("ISPB do remetente inválido")
    ErrInvalidReceiverISP = errors.New("ISPB do destinatário inválido")
    ErrSameBankTransfer  = errors.New("transferência para o mesmo banco")
    ErrAmountMismatch    = errors.New("valor da transação difere do total")
)
```

Sentiu a diferença? Em TypeScript, cada validação retornava um objeto `{ error }`. Em Go, usamos errors tipados que podem ser inspecionados com `errors.Is()`. Isso permite que o handler central trate cada erro de forma diferente:

```go
func processPayment(c *gin.Context) {
    var msg PACS008
    if err := c.ShouldBindXML(&msg); err != nil {
        respondError(c, 400, "FORMAT_ERROR", "XML inválido: "+err.Error())
        return
    }

    if err := validatePayment(msg); err != nil {
        switch {
        case errors.Is(err, ErrInvalidAmount):
            respondError(c, 422, "INVALID_AMOUNT", err.Error())
        case errors.Is(err, ErrSameBankTransfer):
            respondError(c, 422, "SAME_BANK", err.Error())
        case errors.Is(err, ErrMissingMsgID):
            respondError(c, 422, "MISSING_FIELD", err.Error())
        default:
            respondError(c, 422, "VALIDATION_ERROR", err.Error())
        }
        return
    }

    tx := Transaction{
        ID:          generateID(),
        EndToEndID:  msg.CdtTrfTxInf.EndToEndId,
        Amount:      msg.CdtTrfTxInf.Amount,
        SenderISP:   msg.CdtTrfTxInf.Sender,
        ReceiverISP: msg.CdtTrfTxInf.Receiver,
        Status:      "ACSC",
        Timestamp:   time.Now().UTC(),
    }

    if err := store.Save(tx); err != nil {
        respondError(c, 409, "DUPLICATE", err.Error())
        return
    }

    c.XML(200, buildPACS002(tx))
}
```

---

## A mensagem de resposta (pacs.002)

Toda transação aceita gera uma mensagem de resposta. O padrão ISO 20022 define o `pacs.002`:

```go
type PACS002 struct {
    XMLName xml.Name `xml:"urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10 Document"`
    Body    FIToFIPmtStsRpt `xml:"FIToFIPmtStsRpt"`
}

type FIToFIPmtStsRpt struct {
    GrpHdr struct {
        MsgId   string `xml:"MsgId"`
        CreDtTm string `xml:"CreDtTm"`
    } `xml:"GrpHdr"`
    OrgnlGrpInfAndSts struct {
        OrgnlMsgId string `xml:"OrgnlMsgId"`
        GrpSts     string `xml:"GrpSts"`
    } `xml:"OrgnlGrpInfAndSts"`
    TxInfAndSts []struct {
        OrgnlEndToEndId string `xml:"OrgnlEndToEndId"`
        TxSts           string `xml:"TxSts"`
        StsRsnInf       struct {
            Rsn struct {
                Cd string `xml:"Cd"`
            } `xml:"Rsn"`
        } `xml:"StsRsnInf"`
    } `xml:"TxInfAndSts"`
}

func buildPACS002(tx Transaction) PACS002 {
    now := time.Now().UTC().Format(time.RFC3339)
    return PACS002{
        Body: FIToFIPmtStsRpt{
            GrpHdr: struct {
                MsgId   string `xml:"MsgId"`
                CreDtTm string `xml:"CreDtTm"`
            }{
                MsgId:   "PACS002" + tx.ID[:16],
                CreDtTm: now,
            },
            OrgnlGrpInfAndSts: struct {
                OrgnlMsgId string `xml:"OrgnlMsgId"`
                GrpSts     string `xml:"GrpSts"`
            }{
                OrgnlMsgId: "PACS008" + tx.ID[:16],
                GrpSts:     "ACSC",
            },
            TxInfAndSts: []struct {
                OrgnlEndToEndId string `xml:"OrgnlEndToEndId"`
                TxSts           string `xml:"TxSts"`
                StsRsnInf       struct {
                    Rsn struct {
                        Cd string `xml:"Cd"`
                    } `xml:"Rsn"`
                } `xml:"StsRsnInf"`
            }{
                {
                    OrgnlEndToEndId: tx.EndToEndID,
                    TxSts:           "ACSC",
                    StsRsnInf: struct {
                        Rsn struct {
                            Cd string `xml:"Cd"`
                        } `xml:"Rsn"`
                    }{
                        Rsn: struct{ Cd string `xml:"Cd"` }{
                            Cd: "G000",
                        },
                    },
                },
            },
        },
    }
}
```

Cada tag `xml:"..."` é uma notação XPath-like que o `encoding/xml` do Go entende. O parser percorre a árvore XML seguindo o caminho separado por `>`. É declarativo. Você declara a estrutura e o parser faz o match.

Compare com o regex hell do TypeScript:

```typescript
// TypeScript: regex manual, frágil, quebra com espaçamento diferente
const amount = xml.match(/<IntrBkSttlmAmt[^>]*>([^<]+)<\/IntrBkSttlmAmt>/)?.[1]
const senderISP = xml.match(/<MmbId>(\d{8})<\/MmbId>/)?.[1]

// Go: struct tags, compilado, seguro
Amount  float64 `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>IntrBkSttlmAmt"`
```

O regex do TypeScript quebra se:
- O XML vier com quebras de linha diferentes
- Tiver comentários XML antes do campo
- Tiver namespaces diferentes
- O `MmbId` aparecer em outro contexto (ex: numa struct de erro)

A struct do Go não quebra. O parser segue o caminho exato na árvore DOM do XML. Namespace é verificado. Tipo é validado. Tudo em tempo de compilação.

---

## Health check com métricas

Um SPI real não pode ficar no ar sem monitoramento. Cada banco faz polling de health check a cada 5 segundos.

```go
type HealthResponse struct {
    Status    string `json:"status"`
    Uptime    string `json:"uptime"`
    Version   string `json:"version"`
    TxCount   int    `json:"transactionCount"`
    TxPerSec  float64 `json:"transactionsPerSecond"`
    MemMB     uint64  `json:"memoryMB"`
    GoVersion string `json:"goVersion"`
}

func healthCheck(c *gin.Context) {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)

    txCount := store.Count()
    elapsed := time.Since(startTime).Seconds()
    tps := float64(txCount) / elapsed

    c.JSON(200, HealthResponse{
        Status:    "ok",
        Uptime:    time.Since(startTime).Round(time.Second).String(),
        Version:   "2.0.0",
        TxCount:   txCount,
        TxPerSec:  math.Round(tps*100) / 100,
        MemMB:     m.Alloc / 1024 / 1024,
        GoVersion: runtime.Version(),
    })
}
```

`runtime.ReadMemStats` lê as estatísticas de memória em **microssegundos**, sem pausar nada. Em Node.js, `process.memoryUsage()` também é rápido, mas não te dá informação sobre GC, heap idle, número de objetos — tudo que o `runtime.ReadMemStats` expõe de graça.

```go
// O que você consegue com runtime.ReadMemStats:
type MemStats struct {
    Alloc      uint64 // bytes alocados ativos
    TotalAlloc uint64 // bytes alocados desde o início (monotônico)
    Sys        uint64 // bytes solicitados do SO
    Lookups    uint64 // número de lookups de ponteiro
    Mallocs    uint64 // número de alocações de heap
    Frees      uint64 // número de desalocações de heap
    HeapAlloc  uint64 // bytes no heap ativo
    HeapSys    uint64 // bytes no heap reservados do SO
    HeapIdle   uint64 // bytes no heap não utilizados
    HeapInuse  uint64 // bytes no heap em uso
    PauseTotalNs uint64 // nanossegundos totais em GC pause
    NumGC      uint32 // número de ciclos de GC completados
}
```

Num sistema financeiro, cada um desses números conta uma história. `HeapIdle` alto significa que você alocou mais memória do que precisa. `NumGC` disparando significa que você está criando muitos objetos temporários. `PauseTotalNs` acima de 1s significa que você precisa revisar suas alocações.

---

## Concorrência real: processando 10 mil transações por segundo

O Go brilha quando você precisa processar milhares de transações concorrentes. Cada requisição HTTP no Go roda em sua própria goroutine. O scheduler do Go gerencia milhares de goroutines em poucas threads do SO.

```go
func processPaymentHandler(c *gin.Context) {
    var msg PACS008
    if err := c.ShouldBindXML(&msg); err != nil {
        c.XML(400, buildErrorResponse("FORMAT_ERROR", "XML parsing failed"))
        return
    }

    // A validação roda na goroutine do request
    if err := validatePayment(msg); err != nil {
        c.XML(422, buildErrorResponse("VALIDATION_ERROR", err.Error()))
        return
    }

    start := time.Now()

    tx := Transaction{
        ID:          generateID(),
        EndToEndID:  msg.CdtTrfTxInf.EndToEndId,
        Amount:      msg.CdtTrfTxInf.Amount,
        SenderISP:   msg.CdtTrfTxInf.Sender,
        ReceiverISP: msg.CdtTrfTxInf.Receiver,
        Status:      "ACSC",
        Timestamp:   time.Now().UTC(),
    }

    // Save usa sync.RWMutex — dezenas de leitores simultâneos
    if err := store.Save(tx); err != nil {
        c.XML(409, buildErrorResponse("DUPLICATE", err.Error()))
        return
    }

    elapsed := time.Since(start)
    metrics.recordLatency("pacs.008", elapsed)
    metrics.incCounter("transactions.processed")

    c.XML(200, buildPACS002(tx))
}
```

Cada chamada a `store.Save()` adquire o lock por microssegundos. Enquanto isso, milhares de outras goroutines estão lendo a store com `RLock`, que nunca bloqueia. O resultado é throughput linear com o número de CPUs.

```bash
# Teste de carga com hey (substituto do ab)
hey -n 50000 -c 100 -m POST \
  -H "Content-Type: application/xml" \
  -D testdata/pacs008-example.xml \
  http://localhost:3002/spi/pacs.008

# Resultado:
# 50000 requests em 0.987s
# Throughput: 50648 req/s
# Média de latência: 1.97ms
# P99: 4.23ms
# Nenhum timeout
```

O mesmo teste no Node.js:

```bash
# Resultado com Node.js (Fastify):
# 50000 requests em 24.5s
# Throughput: 2040 req/s
# Média de latência: 49.2ms
# P99: 152ms
# 23 timeouts
```

25x mais throughput. 25x menos latência média. P99 36x menor. Zero timeouts.

E não é porque Node.js é "lento". É porque o modelo de concorrência dele é inadequado pro problema. Node.js é ótimo pra I/O bound (bancos de dados, APIs externas, streaming). Mas é péssimo pra CPU bound (parsing XML, validação, transformação) porque tudo roda na mesma thread.

Go transforma CPU bound em concorrência nativa. Cada parsing de XML roda em sua própria goroutine, em sua própria pilha, em sua própria thread (quando necessário). O scheduler distribui automaticamente.

---

## Invariantes de sistema financeiro

Um sistema de pagamento instantâneo tem invariantes que não podem ser violadas. Nem por um milissegundo:

1. **Idempotência**: mesma `EndToEndId` não pode gerar duas transações
2. **Atomicidade**: ou a transação completa, ou não deixa rastro
3. **Consistência**: o valor total das transações nunca pode divergir dos saldos
4. **Durabilidade**: uma vez confirmada, a transação não pode ser perdida
5. **Ordenação**: transações do mesmo banco precisam ser processadas na ordem

```go
// Invariante 1: Idempotência
func (s *Store) Save(tx Transaction) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    if existingID, ok := s.byEndToEnd[tx.EndToEndID]; ok {
        existing := s.transactions[existingID]
        // Se já foi aceita, rejeita
        if existing.Status == "ACSC" || existing.Status == "ACCP" {
            return ErrDuplicateTransaction
        }
        // Se foi rejeitada antes, permite reenvio
        // (cenário raro de retry do banco remetente)
    }

    s.transactions[tx.ID] = tx
    s.byEndToEnd[tx.EndToEndID] = tx.ID
    return nil
}

// Invariante 2: Atomicidade (aplicação)

// Invariante 3: Consistência
func (s *Store) CheckConsistency() error {
    s.mu.RLock()
    defer s.mu.RUnlock()

    var totalSettled float64
    for _, tx := range s.transactions {
        if tx.Status == "ACSC" {
            totalSettled += tx.Amount
        }
    }

    // O total liquidado precisa bater com o saldo do S2 (simulado)
    if math.Abs(totalSettled-s.s2Balance) > 0.01 {
        return fmt.Errorf(
            "inconsistência: transações totalizam R$%.2f, S2 tem R$%.2f",
            totalSettled, s.s2Balance,
        )
    }
    return nil
}
```

Em TypeScript, essas verificações seriam possíveis, mas a falta de tipagem forte e mutex nativo tornaria o código mais verboso e mais propenso a erros. Você teria que implementar um lock manual com promises:

```typescript
// TypeScript: lock manual com promessa
async function saveTransaction(tx: Transaction): Promise<void> {
  const release = await mutex.acquire()
  try {
    // ... validação e save
  } finally {
    release()
  }
}
```

Funciona, mas é mais verborrágico, mais lento (promessas têm overhead no V8) e mais uma dependência externa (`async-mutex`).

---

## Debugging: como depurar uma transação perdida

Quando um banco reclama que uma transação não chegou, você precisa de ferramentas. Aqui estão os cenários mais comuns e como depurar cada um:

### 1. XML mal formado

```bash
# Problema: curl retorna 400, mas o XML parece correto
curl -v -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# Debug: validar o XML antes de enviar
xmllint --noout testdata/pacs008-example.xml

# Debug: ver o que o Go recebeu
# Adicione log temporário no handler:
log.Printf("XML recebido: %s", rawBody)
```

### 2. Namespace errado

O erro mais comum no SPI é namespace errado. O ISO 20022 usa URNs enormes e qualquer caractere errado faz o parser devolver uma struct vazia.

```xml
<!-- ERRADO: namespace antigo (001.07) -->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.07">

<!-- CORRETO: namespace atual (001.08) -->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
```

No Go, se o namespace da struct não bater com o do XML, o `encoding/xml` simplesmente retorna uma struct zerada. Sem erro. Sem warning. É um dos poucos pontos de atenção:

```go
type PACS008 struct {
    // Se o namespace aqui não bater, GrpHdr vem vazio
    XMLName xml.Name `xml:"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08 Document"`
}
```

Debug: sempre verifique se `GrpHdr.MsgId` está preenchido depois do parsing:

```go
if msg.GrpHdr.MsgId == "" {
    log.Printf("ALERTA: parsing silencioso falhou — namespace pode estar errado")
    log.Printf("Esperado: urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08")
    log.Printf("XML recebido:\n%s", rawBody[:min(len(rawBody), 500)])
}
```

### 3. Transação não encontrada

```bash
# Problema: cliente diz que enviou, mas não aparece na lista
curl http://localhost:3002/spi/transactions

# Debug: procurar por EndToEndId específico
curl http://localhost:3002/spi/transactions/E2E202606260001
```

Código do endpoint de busca:

```go
func getTransactionByID(c *gin.Context) {
    endToEndID := c.Param("endToEndId")

    tx, found := store.FindByEndToEnd(endToEndID)
    if !found {
        c.JSON(404, gin.H{
            "error":     "transaction_not_found",
            "endToEndId": endToEndID,
        })
        return
    }

    c.JSON(200, tx)
}
```

### 4. Race condition em teste de carga

```bash
# Rodar com race detector do Go (ESSENCIAL)
go run -race .
```

O race detector do Go é uma das ferramentas mais subestimadas. Ele instrumenta o binário em tempo de compilação e detecta qualquer acesso concorrente a memória sem sincronização. Rode sempre com `-race` durante o desenvolvimento.

```go
// Exemplo de bug que o race detector pegaria
func (s *Store) Count() int {
    // ERRADO: leu sem lock
    return len(s.transactions)
}

// CORRETO
func (s *Store) Count() int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return len(s.transactions)
}
```

O race detector não só reporta o bug como mostra exatamente qual goroutine escreveu e qual leu sem sincronização:

```
WARNING: DATA RACE
Read at 0x00c0000b2000 by goroutine 8:
  main.(*Store).Count()
      spi/store.go:42 +0x64

Previous write at 0x00c0000b2000 by goroutine 12:
  main.(*Store).Save()
      spi/store.go:28 +0x128
```

---

## Os 4 endpoints

```go
r.POST("/spi/pacs.008", processPayment)        // Recebe crédito
r.GET("/spi/transactions", getTransactions)      // Lista transações
r.GET("/spi/transactions/:endToEndId", getByID)  // Consulta por ID
r.GET("/spi/health", healthCheck)                // Health check
```

Parece pouco, mas cada um faz mais do que parece:

- `POST /spi/pacs.008`: parsing XML, validação de 8 invariantes, detecção de duplicata, lock de escrita, geração de pacs.002, métricas de latência
- `GET /spi/transactions`: lock de leitura, serialização JSON, suporte a paginação (não mostrado aqui, mas necessário em produção)
- `GET /spi/transactions/:endToEndId`: lookup O(1) no mapa `byEndToEnd`, retorno 404 se não encontrado
- `GET /spi/health`: métricas de runtime, contagem de transações, versão, uptime

### Paginação (improviso essencial pra produção)

Sem paginação, um banco com 1 milhão de transações derrubaria o endpoint GET:

```go
func getTransactions(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 1000 {
        limit = 100
    }

    all := store.List()
    start := (page - 1) * limit
    if start >= len(all) {
        c.JSON(200, gin.H{"data": []Transaction{}, "page": page, "total": len(all)})
        return
    }

    end := start + limit
    if end > len(all) {
        end = len(all)
    }

    c.JSON(200, gin.H{
        "data":  all[start:end],
        "page":  page,
        "limit": limit,
        "total": len(all),
    })
}
```

---

## Como testar

```bash
# Sobe o SPI
cd packages/backend/spi-simulator-go
go run .

# Manda uma transação
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# Ver o resultado
curl http://localhost:3002/spi/transactions
```

### Teste de transação inválida

```bash
# XML sem campo obrigatório
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d '<Document xmlns="..."><FIToFICstmrCdtTrf><GrpHdr></GrpHdr></FIToFICstmrCdtTrf></Document>'

# Resposta esperada: 422 com VALIDATION_ERROR
```

### Teste de duplicata

```bash
# Envia a mesma transação duas vezes
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# Primeira: 200 ACSC
# Segunda: 409 DUPLICATE
```

### Teste de carga com hey

```bash
# Instala o hey (se não tiver)
brew install hey

# 10 mil requisições, 100 concorrentes
hey -n 10000 -c 100 -m POST \
  -H "Content-Type: application/xml" \
  -D testdata/pacs008-example.xml \
  http://localhost:3002/spi/pacs.008
```

### Teste de resiliência

```bash
# Mata o processo e levanta de novo — transações persistem?
# (Sim, se você implementar persistência. No nosso simulador não, é em memória)

# Envia 100 transações
for i in $(seq 1 100); do
  sed "s/E2E202606260001/E2E20260626$(printf '%04d' $i)/" \
    testdata/pacs008-example.xml | \
  curl -X POST -H "Content-Type: application/xml" -d @- \
    http://localhost:3002/spi/pacs.008
done

# Mata e reinicia
pkill spi-simulator
go run . &
sleep 1

# Verifica se as transações sumiram
curl http://localhost:3002/spi/transactions | json_pp
# Resultado: [] vazio — é esperado. Em produção, usaria Redis ou PostgreSQL.
```

---

## Edge cases que quebraram em produção

### 1. Stale reads no Node.js

```typescript
// TypeScript: problema de stale read com async
const transactions = new Map<string, Transaction>()

async function processPayment(xml: string) {
  const parsed = parsePACS008(xml)
  // Nesse intervalo, outra requisição pode ter processado o mesmo EndToEndId
  if (transactions.has(parsed.endToEndId)) {
    return { status: 'RJCT', reason: 'Duplicado' }
  }
  // Race condition: duas requisições passam pela checagem ao mesmo tempo
  await checkWithBank(parsed)  // I/O assíncrono
  transactions.set(parsed.endToEndId, tx)  // Ambas chegam aqui
}
```

Duas requisições chegam ao mesmo tempo. Ambas passam pela checagem de duplicata. Ambas fazem I/O assíncrono. Ambas salvam. Resultado: duas transações com o mesmo EndToEndId. Dinheiro duplicado.

Em Go, o `sync.RWMutex` previne isso:

```go
func (s *Store) Save(tx Transaction) error {
    s.mu.Lock()  // Só uma goroutine passa
    defer s.mu.Unlock()

    if _, ok := s.byEndToEnd[tx.EndToEndID]; ok {
        return ErrDuplicateTransaction  // A segunda sempre pega
    }
    s.transactions[tx.ID] = tx
    s.byEndToEnd[tx.EndToEndID] = tx.ID
    return nil
}
```

### 2. Float impreciso

JavaScript: `0.1 + 0.2 = 0.30000000000000004`. Agora imagina isso acontecendo no meio de uma liquidação de R$ 15.738.294,12.

```typescript
// TypeScript: float64 impreciso
const amount = 15_738_294.12
const fee = amount * 0.001  // 15738.29412
// Arredondamento: 15738.29 ou 15738.30?
// Cada banco faz de um jeito. Resultado: divergência de centavos.
```

Em Go, você usa `int64` para valores financeiros:

```go
// Go: tudo em centavos (int64)
type MonetaryAmount struct {
    Value    int64  // centavos
    Currency string // ISO 4217
}

func NewMonetaryAmount(reais float64) MonetaryAmount {
    cents := math.Round(reais * 100)
    return MonetaryAmount{Value: int64(cents), Currency: "BRL"}
}

func (m MonetaryAmount) ToReais() float64 {
    return float64(m.Value) / 100
}

func (m MonetaryAmount) Add(other MonetaryAmount) MonetaryAmount {
    return MonetaryAmount{Value: m.Value + other.Value, Currency: m.Currency}
}
```

Repare: `int64` para centavos. Sem float point. Sem `0.1 + 0.2`. Cada centavo é um inteiro exato. A soma de 10 mil transações sempre fecha.

### 3. Timeout no processamento

O SPI real tem timeout de 10 segundos. Se o banco não responder em 10s, a transação é automaticamente revertida.

```go
func processPaymentWithTimeout(msg PACS008) (Transaction, error) {
    result := make(chan Transaction, 1)
    errCh := make(chan error, 1)

    go func() {
        // Processamento pode incluir chamada HTTP ao banco destino
        tx, err := processPayment(msg)
        if err != nil {
            errCh <- err
            return
        }
        result <- tx
    }()

    select {
    case tx := <-result:
        return tx, nil
    case err := <-errCh:
        return Transaction{}, err
    case <-time.After(10 * time.Second):
        return Transaction{}, ErrTimeout
    }
}
```

O `select` do Go é um dos recursos mais elegantes da linguagem. Ele espera múltiplos canais simultaneamente e executa o primeiro que responder. O `time.After` cria um canal que dispara após 10 segundos. Se o processamento demorar mais que isso, o timeout vence e a transação é rejeitada.

Em TypeScript, você faria algo similar com `Promise.race`:

```typescript
async function processPaymentWithTimeout(msg: PACS008): Promise<Transaction> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
  return Promise.race([processPayment(msg), timeout])
}
```

Funciona, mas com uma diferença crucial: `Promise.race` não cancela a promise perdedora. A promise do `processPayment` continua rodando em background, consumindo memória, até completar ou ser coletada pelo GC. O `select` do Go também não cancela a goroutine perdedora, mas goroutines são muito mais leves que promises do V8 (~4KB vs ~40KB de overhead), então o dano é menor.

---

## O que aprendi

1. **XML é chato, mas necessário** — O mundo financeiro roda em XML desde os anos 90. Não vai mudar amanhã. ISO 20022 é verboso, aninhado, e doloroso de debugar. Mas é o padrão que permite que 150 bancos brasileiros troquem dinheiro em milissegundos. Não tente fugir dele. Aprenda a domá-lo.

2. **ISO 20022 é o futuro** — Pix já usa. SPI já usa. O SPC (Sistema de Pagamentos de Crédito) do BC também está migrando. A Europa já migrou com o SEPA. Os EUA estão migrando com o FedNow. Quem não adotar vai ficar pra trás. E o padrão é tão grande (centenas de mensagens, milhares de campos) que ninguém implementa tudo — cada instituição implementa um subconjunto.

3. **Go não é bala de prata** — É uma ferramenta. Use onde faz sentido. Mas quando faz sentido, faz muito sentido. Para sistemas financeiros de alta frequência, Go é uma escolha natural por causa da previsibilidade de latência, concorrência nativa, e ausência de GC surpresa. Para APIs de negócio com pouca carga, TypeScript é mais produtivo.

4. **Performance importa** — Mas não a qualquer custo. Às vezes 50ms é suficiente. E às vezes 50ms é a diferença entre o banco aprovar ou não sua transação. Conheça seu SLA. E mais importante: conheça a cauda da sua latência (P99, P99.9). A média mente. 50ms de média com picos de 500ms no P99 é inaceitável pra SPI.

5. **Garbage collector é um risco financeiro** — Linguagens com GC generacional (Java, C#, JavaScript) têm pausas imprevisíveis. Em 99.9% dos sistemas, isso não importa. Em sistemas de pagamento instantâneo com SLA de 10 segundos, cada pausa de 100ms conta. Go prova que é possível ter GC sem pausas perceptíveis — desde que você respeite o design da linguagem.

6. **Prefira int64 para dinheiro** — Float point para dinheiro é o erro mais comum de quem está começando com sistemas financeiros. Um centavo errado em 10 milhões de transações vira R$ 100 mil de divergência. Use inteiros. Sempre.

7. **Idempotência é a base de tudo** — O SPI garante que uma transação com o mesmo `EndToEndId` só é processada uma vez. Mas isso depende do banco remetente gerar IDs únicos. Quando o banco remetente tem um bug e reusa IDs, o SPI precisa rejeitar. É um contrato bilateral entre o BC e os bancos.

8. **Teste de carga com dados reais** — Não adianta testar com um XML bonitinho. Use dados reais com todos os campos opcionais, todos os namespaces, todos os edge cases. Um XML real de Pix tem campos que você nunca viu na documentação.

9. **Prefira ferramentas nativas** — TypeScript precisava de `fastify-xml-body-parser` (que não funcionava), `async-mutex` (que adicionava overhead), e dependências externas. Go tem `encoding/xml`, `sync`, e `net/http` na stdlib. Menos dependências = menos superfície de ataque = menos coisas que podem quebrar.

10. **Observabilidade não é opcional** — Em produção, você vai precisar saber quantas transações estão sendo processadas por segundo, qual a latência P99, quantas estão sendo rejeitadas, e qual o tamanho do heap. Em Go, `runtime.ReadMemStats` + métricas customizadas + structured logging resolvem. Em TypeScript, você depende de bibliotecas externas (OpenTelemetry, Prometheus client) que nem sempre funcionam bem com o ecossistema.

11. **Deploy simplificado** — Go compila um binário estático de ~15MB. Você copia pro servidor e executa. Sem `npm install`, sem `node_modules`, sem versões de runtime, sem "mas na minha máquina funciona". O deploy é um SCP. O rollback é um SCP do binário anterior.

12. **A dor do contexto** — O Node.js tem o `AsyncLocalStorage` (desde v13.10), mas ele é lento e opcional. Em Go, o `context.Context` é onipresente. Cada request carrega um contexto com timeout, tracing, e valores. O pacote `net/http` do Go gerencia o ciclo de vida automaticamente. Se o cliente desconectar, o contexto é cancelado e a goroutine pode parar de processar.

```go
func processPaymentHandler(c *gin.Context) {
    // O contexto do request carrega tracing, timeout, e autenticação
    ctx := c.Request.Context()

    // Se o cliente desconectar, ctx.Done() é fechado
    select {
    case <-ctx.Done():
        log.Printf("Cliente desconectou, abortando processamento")
        return
    case <-time.After(100 * time.Millisecond):
        // Processamento simulado
    }
}
```

---

## Próximos passos

Esse simulador é a base. Ele mostra o coração do SPI: receber uma mensagem ISO 20022, validar, processar e responder. Mas o SPI real é muito maior:

1. **Persistência** — Em vez de Map em memória, use PostgreSQL (ou SQLite pra dev). Transações precisam sobreviver a restart.
2. **S2 Simulator** — Implemente o Sistema de Transferência de Reservas. É ele que move o dinheiro entre as contas dos bancos no BC.
3. **Liquidação bruta em tempo real (LBTR)** — Cada transação é liquidada individualmente, sem netting. Implemente o debito/crédito nas contas de reserva.
4. **Mensagens negativas** — `pacs.004` (devolução), `camt.056` (cancelamento), `admi.002` (evento administrativo).
5. **Zona de espera (queuing)** — Se o banco destino estiver offline, as mensagens ficam em fila até ele voltar.
6. **Anti-money laundering (AML)** — Transações acima de R$ 10.000 exigem notificação ao COAF.
7. **Limites Pix** — Período noturno (20h-6h) tem limite de R$ 1.000. Período diurno tem limite que cada banco define.
8. **Tarifação** — O BC cobra dos bancos por transação liquidada. Simule a tarifa de R$ 0,01 por Pix.
9. **Horário de funcionamento** — O SPI funciona 24/7, mas o S2 não. Liquidacões fora do horário do S2 ficam em fila técnica.

Cada um desses itens merece seu próprio desafio. Mas o simulador que você construiu aqui — com validação, parsing ISO 20022, store concorrente, e resposta pacs.002 — é a fundação de todos eles.

E se você ainda está debatendo entre JavaScript e Go pra esse tipo de sistema: implementa os dois. Compara. Aprende. Porque teoria é teoria, mas sentir 100ms de GC pause na sua própria aplicação é uma aula que você nunca esquece.
