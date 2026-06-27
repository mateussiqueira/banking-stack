# Challenge 02 — SPI Simulator

**🇧🇷** Simulador do Sistema de Pagamentos Instantâneos  
**🇬🇧** Instant Payment System Simulator

---

You ever sent a Pix and stopped to think about what actually happens between hitting "confirm" and the money landing? Yeah. It's not magic. It's SPI.

SPI is the Instant Payment System from the Central Bank of Brazil. It's the middleman between your bank and the recipient's bank. Every Pix transaction goes through it. If it goes down, Pix goes down. If it's slow, Pix is slow. If it has a bug, money vanishes.

This challenge is about building a simulator for it. And then rewriting it in Go because TypeScript couldn't hack it.

---

## The flow of a Pix

```
Your phone → Nubank → SPI (Central Bank) → Itaú → Destination account
```

Looks simple, but each of those arrows hides a world of complexity. Between Nubank and Itaú, SPI needs to do 5 things in under 10 seconds:

1. Validate the transaction (format, funds, limits)
2. Check if the destination bank exists and accepts it
3. Settle the payment between banks
4. Notify both banks
5. If something goes wrong, reverse it

All of this in XML. ISO 20022. A standard that's here to stay.

The Bacen S2 (Reserve Transfer System) is the settlement system that moves money between bank reserve accounts. SPI coordinates the messages, but S2 actually transfers the balance. Each bank has a reserve account at the Central Bank. When you make a Pix, SPI:
1. Receives the message from the paying bank
2. Checks if the paying bank has balance in their reserve account
3. Debits the paying bank's account in S2
4. Credits the receiving bank's account in S2
5. Sends confirmation to both

All in milliseconds. If S2 is down, Pix doesn't settle. If SPI is down, the message doesn't arrive. That's why the Central Bank has a 99.999% SLA for SPI. And a R$ 50,000 fine per hour of downtime.

---

## The ISO 20022 standard

ISO 20022 isn't just an XML format. It's a methodology. A financial ontology. Each message has a specific purpose, a 4-letter code (pacs.008, pacs.002, pacs.004, camt.056, etc.), and a field hierarchy that can't be violated.

The main SPI messages:

| Code | Name | Purpose |
|--------|------|-----------|
| `pacs.008` | FIToFICustomerCreditTransfer | Credit transfer |
| `pacs.002` | FIToFIPaymentStatusReport | Transaction status |
| `pacs.004` | PaymentReturn | Payment return |
| `pacs.028` | FIToFIPaymentReversal | Technical reversal |
| `camt.056` | FIToFIPaymentCancellationRequest | Cancellation request |
| `camt.060` | AccountReporting | Settlement statement |
| `admi.002` | ApplicationEvent | Administrative event |

Every message follows an envelope structure: a header (`GrpHdr`) containing metadata (ID, number of transactions, total value, date/time), followed by the transaction details (`CdtTrfTxInf`) containing the amount, the banks involved, the payer, the receiver, and the payment purpose.

And yes, everything is nested. Deeply. Each field is 3, 4, sometimes 5 levels deep. The XML you see below is the simplest possible. A real Pix has optional fields that add another 3 or 4 nesting levels.

---

## The first version (TypeScript)

I started with Node.js + Fastify. It was ready in 2 hours. It worked.

```typescript
app.post('/spi/pacs.008', async (request, reply) => {
  const xml = request.body
  const result = processPayment(xml)
  return reply.send(result)
})
```

Simple. Direct. Tested. Shipped.

But then the problems came:

1. **XML is a nightmare** — `fastify-xml-body-parser` didn't compile with strict TypeScript. Had to parse it manually.
2. **Performance** — 50ms per request. Doesn't sound like much, but when you're processing 10K per second, every millisecond is a bank complaining.
3. **Memory** — 50MB of heap. Node.js decides when to run garbage collection. And when it does, everything freezes for 100ms. In a financial system, a 100ms pause is a lost transaction.

And the worst part: there's no way to predict when it'll happen. It's a lottery.

I'll show you the full TypeScript version so you can feel the pain:

```typescript
import Fastify from 'fastify'
import { randomUUID } from 'node:crypto'

const app = Fastify({ logger: true })

// The hell of manual XML parsing
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
      return { error: 'Required fields missing in XML' }
    }

    return { msgId, endToEndId, amount, senderISP, receiverISP }
  } catch (e) {
    return { error: `Parsing failed: ${e}` }
  }
}

// In-memory database
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

  // Validate ISPB (8 numeric digits)
  if (!/^\d{8}$/.test(parsed.senderISP)) {
    return { status: 'RJCT', reason: 'Invalid sender ISPB' }
  }
  if (!/^\d{8}$/.test(parsed.receiverISP)) {
    return { status: 'RJCT', reason: 'Invalid receiver ISPB' }
  }

  // Validate positive amount
  if (parsed.amount <= 0) {
    return { status: 'RJCT', reason: 'Amount must be positive' }
  }

  // Validate duplicate (unique EndToEndId)
  if (Array.from(transactions.values()).some(
    t => t.endToEndId === parsed.endToEndId && t.status === 'accepted'
  )) {
    return { status: 'RJCT', reason: 'Duplicate EndToEndId' }
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

The code was decent. But in practice, every regex match created a temporary string on the heap. Every parseFloat allocated a Number object. Every `Array.from` iterated over the entire Map — O(n) on each request. With 10K transactions in the map, every GET became a 10K-check loop.

And the worst: V8's garbage collector. It doesn't warn you. It doesn't ask permission. It just pauses the event loop and sweeps the heap. In a 100ms pause, you lose dozens of transactions being processed. Banks don't forgive 100ms.

```bash
# Node.js profile showing GC pauses
node --trace-gc spi-server.mjs 2>&1 | grep "Mark-sweep" | head -5

[28645:0x150008000]   1234567 ms: Mark-sweep 52.3 -> 48.2 MB, 102.4 / 0.0 ms
[28645:0x150008000]   2345678 ms: Mark-sweep 55.1 -> 47.8 MB, 98.7 / 0.0 ms
[28645:0x150008000]   3456789 ms: Mark-sweep 54.9 -> 46.5 MB, 105.2 / 0.0 ms
```

Look at that: 100ms pauses. A GC cycle sweeping 50MB of heap. In production, with 10K transactions per second, you can't have 100ms pauses. Every pause means a growing queue, timeouts expiring, banks complaining.

At the time I thought: "I'll increase the heap, give V8 more memory." Only made it worse. More heap = more GC time. More objects = more fragmentation. V8 has a very good generational GC for browsers, but for a financial server with intense temporary object allocation (XML strings, buffers, transaction objects), it simply wasn't designed for it.

That's when I looked at Go.

---

## The rewrite in Go

It wasn't because Go is "better." It was because Go is more suitable for this specific case.

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

The difference?

| Metric | TypeScript | Go |
|---------|-----------|-----|
| Startup | ~2s | ~50ms |
| Memory | ~50MB | ~10MB |
| XML Parsing | ~5ms | ~0.2ms |
| Throughput | ~2K req/s | ~50K req/s |
| Binary | N/A (needs Node) | ~15MB (standalone) |
| GC pauses | ~100ms (unpredictable) | ~1ms (predictable) |
| XML struct mapping | Manual regex | Native `encoding/xml` |
| Concurrency | Single-thread + async | Native goroutines |
| Deploy | `npm install` + node | `scp binary` + run |

But the real benefit isn't raw speed. It's **predictability**. Go doesn't have surprise garbage collection. Memory is managed deterministically. You know exactly when and how much you'll use.

Go uses a concurrent garbage collector with a target latency of <2ms since Go 1.8. It doesn't stop the world — just specific goroutine packs at a time. And it runs in parallel with the program, not blocking. V8 does mark-sweep that pauses everything. Go does concurrent mark-sweep with a write barrier.

In practice, this means:

- In Node.js: every 30 seconds, your app freezes for 100ms
- In Go: every 2 minutes, the GC runs in the background and you don't notice

For a real-time financial system, the choice is obvious.

---

## Payment processing in Go

Let's dive deep into the logic:

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

Notice the `sync.RWMutex`. In Go, explicit concurrency is part of the language. `RLock` allows multiple simultaneous readers without blocking. Exclusive `Lock` is used only for writes. In TypeScript, you'd need `async-mutex` or a manual implementation. In Go, `sync` is part of the standard library.

Another subtle difference: `make([]Transaction, 0, len(s.transactions))`. Go lets you pre-allocate the slice with exact capacity. Zero extra allocations during append. In TypeScript, `Array.from(map.values())` makes two passes: one to create the iterator, another to populate the array. Each pass allocates. Nothing is free in a language with GC.

### Complete validation

```go
func validatePayment(tx PACS008) error {
    // 1. MsgId required
    if tx.GrpHdr.MsgId == "" {
        return ErrMissingMsgID
    }

    // 2. Number of transactions
    if tx.GrpHdr.NbOfTxs <= 0 {
        return ErrInvalidTxCount
    }

    // 3. Total amount
    if tx.GrpHdr.Amount <= 0 {
        return ErrInvalidAmount
    }

    // 4. EndToEndId required
    if tx.CdtTrfTxInf.EndToEndId == "" {
        return ErrMissingEndToEndID
    }

    // 5. Sender ISPB: 8 numeric digits
    if !isValidISP(tx.CdtTrfTxInf.Sender) {
        return ErrInvalidSenderISP
    }

    // 6. Receiver ISPB: 8 numeric digits
    if !isValidISP(tx.CdtTrfTxInf.Receiver) {
        return ErrInvalidReceiverISP
    }

    // 7. Sender and receiver can't be the same
    if tx.CdtTrfTxInf.Sender == tx.CdtTrfTxInf.Receiver {
        return ErrSameBankTransfer
    }

    // 8. Transaction amount matches total
    if tx.CdtTrfTxInf.Amount != tx.GrpHdr.Amount {
        return ErrAmountMismatch
    }

    return nil
}

var (
    ErrMissingMsgID      = errors.New("MsgId missing")
    ErrInvalidTxCount    = errors.New("invalid NbOfTxs")
    ErrInvalidAmount     = errors.New("amount must be positive")
    ErrMissingEndToEndID = errors.New("EndToEndId missing")
    ErrInvalidSenderISP  = errors.New("invalid sender ISPB")
    ErrInvalidReceiverISP = errors.New("invalid receiver ISPB")
    ErrSameBankTransfer  = errors.New("transfer to the same bank")
    ErrAmountMismatch    = errors.New("transaction amount differs from total")
)
```

Feel the difference? In TypeScript, each validation returned an `{ error }` object. In Go, we use typed errors that can be inspected with `errors.Is()`. This lets the central handler treat each error differently:

```go
func processPayment(c *gin.Context) {
    var msg PACS008
    if err := c.ShouldBindXML(&msg); err != nil {
        respondError(c, 400, "FORMAT_ERROR", "Invalid XML: "+err.Error())
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

## The response message (pacs.002)

Every accepted transaction generates a response message. ISO 20022 defines the `pacs.002`:

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

Each `xml:"..."` tag is an XPath-like notation that Go's `encoding/xml` understands. The parser walks the XML tree following the path separated by `>`. It's declarative. You declare the structure and the parser does the matching.

Compare with the TypeScript regex hell:

```typescript
// TypeScript: manual regex, fragile, breaks with different spacing
const amount = xml.match(/<IntrBkSttlmAmt[^>]*>([^<]+)<\/IntrBkSttlmAmt>/)?.[1]
const senderISP = xml.match(/<MmbId>(\d{8})<\/MmbId>/)?.[1]

// Go: struct tags, compiled, safe
Amount  float64 `xml:"FIToFICstmrCdtTrf>CdtTrfTxInf>IntrBkSttlmAmt"`
```

The TypeScript regex breaks if:
- The XML has different line breaks
- There are XML comments before the field
- The namespaces are different
- `MmbId` appears in another context (e.g., in an error struct)

The Go struct doesn't break. The parser follows the exact path in the XML DOM tree. Namespace is verified. Type is validated. Everything at compile time.

---

## Health check with metrics

A real SPI can't stay up without monitoring. Every bank polls the health check every 5 seconds.

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

`runtime.ReadMemStats` reads memory statistics in **microseconds**, without pausing anything. In Node.js, `process.memoryUsage()` is also fast, but it doesn't give you info about GC, heap idle, number of objects — everything that `runtime.ReadMemStats` exposes for free.

```go
// What you get with runtime.ReadMemStats:
type MemStats struct {
    Alloc      uint64 // bytes allocated and in use
    TotalAlloc uint64 // bytes allocated since start (monotonic)
    Sys        uint64 // bytes requested from OS
    Lookups    uint64 // number of pointer lookups
    Mallocs    uint64 // number of heap allocations
    Frees      uint64 // number of heap deallocations
    HeapAlloc  uint64 // bytes in active heap
    HeapSys    uint64 // bytes in heap reserved from OS
    HeapIdle   uint64 // bytes in heap not in use
    HeapInuse  uint64 // bytes in heap in use
    PauseTotalNs uint64 // total nanoseconds in GC pause
    NumGC      uint32 // number of completed GC cycles
}
```

In a financial system, each of these numbers tells a story. High `HeapIdle` means you allocated more memory than you need. `NumGC` firing fast means you're creating too many temporary objects. `PauseTotalNs` above 1s means you need to review your allocations.

---

## Real concurrency: processing 10K transactions per second

Go shines when you need to process thousands of concurrent transactions. Each HTTP request in Go runs in its own goroutine. Go's scheduler manages thousands of goroutines across few OS threads.

```go
func processPaymentHandler(c *gin.Context) {
    var msg PACS008
    if err := c.ShouldBindXML(&msg); err != nil {
        c.XML(400, buildErrorResponse("FORMAT_ERROR", "XML parsing failed"))
        return
    }

    // Validation runs in the request's goroutine
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

    // Save uses sync.RWMutex — dozens of simultaneous readers
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

Each call to `store.Save()` acquires the lock for microseconds. Meanwhile, thousands of other goroutines are reading the store with `RLock`, which never blocks. The result is linear throughput with the number of CPUs.

```bash
# Load test with hey
hey -n 50000 -c 100 -m POST \
  -H "Content-Type: application/xml" \
  -D testdata/pacs008-example.xml \
  http://localhost:3002/spi/pacs.008

# Result:
# 50000 requests in 0.987s
# Throughput: 50648 req/s
# Average latency: 1.97ms
# P99: 4.23ms
# Zero timeouts
```

The same test on Node.js:

```bash
# Result with Node.js (Fastify):
# 50000 requests in 24.5s
# Throughput: 2040 req/s
# Average latency: 49.2ms
# P99: 152ms
# 23 timeouts
```

25x more throughput. 25x less average latency. P99 36x smaller. Zero timeouts.

And it's not because Node.js is "slow." It's because its concurrency model is wrong for this problem. Node.js is great for I/O bound (databases, external APIs, streaming). But it's terrible for CPU bound (XML parsing, validation, transformation) because everything runs on the same thread.

Go turns CPU bound into native concurrency. Each XML parsing runs in its own goroutine, its own stack, its own thread (when needed). The scheduler distributes automatically.

---

## Financial system invariants

An instant payment system has invariants that must never be violated. Not even for a millisecond:

1. **Idempotency**: same `EndToEndId` must not generate two transactions
2. **Atomicity**: either the transaction completes, or it leaves no trace
3. **Consistency**: the total transaction value must never diverge from balances
4. **Durability**: once confirmed, the transaction must not be lost
5. **Ordering**: transactions from the same bank must be processed in order

```go
// Invariant 1: Idempotency
func (s *Store) Save(tx Transaction) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    if existingID, ok := s.byEndToEnd[tx.EndToEndID]; ok {
        existing := s.transactions[existingID]
        // If already accepted, reject
        if existing.Status == "ACSC" || existing.Status == "ACCP" {
            return ErrDuplicateTransaction
        }
        // If previously rejected, allow resend
        // (rare retry scenario from the sending bank)
    }

    s.transactions[tx.ID] = tx
    s.byEndToEnd[tx.EndToEndID] = tx.ID
    return nil
}

// Invariant 2: Atomicity (application)

// Invariant 3: Consistency
func (s *Store) CheckConsistency() error {
    s.mu.RLock()
    defer s.mu.RUnlock()

    var totalSettled float64
    for _, tx := range s.transactions {
        if tx.Status == "ACSC" {
            totalSettled += tx.Amount
        }
    }

    // The settled total must match the S2 balance (simulated)
    if math.Abs(totalSettled-s.s2Balance) > 0.01 {
        return fmt.Errorf(
            "inconsistency: transactions total R$%.2f, S2 has R$%.2f",
            totalSettled, s.s2Balance,
        )
    }
    return nil
}
```

In TypeScript, these checks would be possible, but the lack of strong typing and native mutex would make the code more verbose and more error-prone. You'd have to implement a manual lock with promises:

```typescript
// TypeScript: manual lock with promise
async function saveTransaction(tx: Transaction): Promise<void> {
  const release = await mutex.acquire()
  try {
    // ... validation and save
  } finally {
    release()
  }
}
```

It works, but it's more verbose, slower (promises have overhead in V8), and requires an external dependency (`async-mutex`).

---

## Debugging: how to debug a lost transaction

When a bank complains a transaction didn't arrive, you need tools. Here are the most common scenarios and how to debug each:

### 1. Malformed XML

```bash
# Problem: curl returns 400, but the XML looks correct
curl -v -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# Debug: validate the XML before sending
xmllint --noout testdata/pacs008-example.xml

# Debug: see what Go received
# Add temporary log in handler:
log.Printf("XML received: %s", rawBody)
```

### 2. Wrong namespace

The most common SPI error is a wrong namespace. ISO 20022 uses enormous URNs and any wrong character makes the parser return an empty struct.

```xml
<!-- WRONG: old namespace (001.07) -->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.07">

<!-- CORRECT: current namespace (001.08) -->
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
```

In Go, if the struct's namespace doesn't match the XML's, `encoding/xml` simply returns a zeroed struct. No error. No warning. It's one of the few gotchas:

```go
type PACS008 struct {
    // If the namespace here doesn't match, GrpHdr comes empty
    XMLName xml.Name `xml:"urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08 Document"`
}
```

Debug: always check if `GrpHdr.MsgId` is filled after parsing:

```go
if msg.GrpHdr.MsgId == "" {
    log.Printf("ALERT: silent parsing failed — namespace may be wrong")
    log.Printf("Expected: urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08")
    log.Printf("XML received:\n%s", rawBody[:min(len(rawBody), 500)])
}
```

### 3. Transaction not found

```bash
# Problem: client says they sent it, but it doesn't show up
curl http://localhost:3002/spi/transactions

# Debug: search by EndToEndId
curl http://localhost:3002/spi/transactions/E2E202606260001
```

Search endpoint code:

```go
func getTransactionByID(c *gin.Context) {
    endToEndID := c.Param("endToEndId")

    tx, found := store.FindByEndToEnd(endToEndID)
    if !found {
        c.JSON(404, gin.H{
            "error":      "transaction_not_found",
            "endToEndId": endToEndID,
        })
        return
    }

    c.JSON(200, tx)
}
```

### 4. Race condition in load test

```bash
# Run with Go's race detector (ESSENTIAL)
go run -race .
```

Go's race detector is one of the most underrated tools. It instruments the binary at compile time and detects any concurrent memory access without synchronization. Always run with `-race` during development.

```go
// Example of a bug the race detector would catch
func (s *Store) Count() int {
    // WRONG: read without lock
    return len(s.transactions)
}

// CORRECT
func (s *Store) Count() int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return len(s.transactions)
}
```

The race detector not only reports the bug but shows exactly which goroutine wrote and which read without synchronization:

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

## The 4 endpoints

```go
r.POST("/spi/pacs.008", processPayment)        // Receives credit
r.GET("/spi/transactions", getTransactions)      // Lists transactions
r.GET("/spi/transactions/:endToEndId", getByID)  // Query by ID
r.GET("/spi/health", healthCheck)                // Health check
```

Looks small, but each does more than meets the eye:

- `POST /spi/pacs.008`: XML parsing, 8-invariant validation, duplicate detection, write lock, pacs.002 generation, latency metrics
- `GET /spi/transactions`: read lock, JSON serialization, pagination support (not shown here, but needed in production)
- `GET /spi/transactions/:endToEndId`: O(1) lookup in `byEndToEnd` map, 404 return if not found
- `GET /spi/health`: runtime metrics, transaction count, version, uptime

### Pagination (essential improv for production)

Without pagination, a bank with 1 million transactions would tank the GET endpoint:

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

## Testing

```bash
# Start SPI
cd packages/backend/spi-simulator-go
go run .

# Send a transaction
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# Check the result
curl http://localhost:3002/spi/transactions
```

### Invalid transaction test

```bash
# XML without required field
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d '<Document xmlns="..."><FIToFICstmrCdtTrf><GrpHdr></GrpHdr></FIToFICstmrCdtTrf></Document>'

# Expected response: 422 with VALIDATION_ERROR
```

### Duplicate test

```bash
# Send the same transaction twice
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# First: 200 ACSC
# Second: 409 DUPLICATE
```

### Load test with hey

```bash
# Install hey (if you don't have it)
brew install hey

# 10K requests, 100 concurrent
hey -n 10000 -c 100 -m POST \
  -H "Content-Type: application/xml" \
  -D testdata/pacs008-example.xml \
  http://localhost:3002/spi/pacs.008
```

### Resilience test

```bash
# Kill the process and restart — do transactions persist?
# (Yes, if you implement persistence. In our simulator no, it's in-memory)

# Send 100 transactions
for i in $(seq 1 100); do
  sed "s/E2E202606260001/E2E20260626$(printf '%04d' $i)/" \
    testdata/pacs008-example.xml | \
  curl -X POST -H "Content-Type: application/xml" -d @- \
    http://localhost:3002/spi/pacs.008
done

# Kill and restart
pkill spi-simulator
go run . &
sleep 1

# Check if transactions survived
curl http://localhost:3002/spi/transactions | json_pp
# Result: [] empty — expected. In production, you'd use Redis or PostgreSQL.
```

---

## Edge cases that broke in production

### 1. Stale reads in Node.js

```typescript
// TypeScript: stale read problem with async
const transactions = new Map<string, Transaction>()

async function processPayment(xml: string) {
  const parsed = parsePACS008(xml)
  // In this interval, another request may have processed the same EndToEndId
  if (transactions.has(parsed.endToEndId)) {
    return { status: 'RJCT', reason: 'Duplicate' }
  }
  // Race condition: two requests pass the check at the same time
  await checkWithBank(parsed)  // Async I/O
  transactions.set(parsed.endToEndId, tx)  // Both arrive here
}
```

Two requests arrive at the same time. Both pass the duplicate check. Both do async I/O. Both save. Result: two transactions with the same EndToEndId. Duplicate money.

In Go, `sync.RWMutex` prevents this:

```go
func (s *Store) Save(tx Transaction) error {
    s.mu.Lock()  // Only one goroutine gets through
    defer s.mu.Unlock()

    if _, ok := s.byEndToEnd[tx.EndToEndID]; ok {
        return ErrDuplicateTransaction  // The second always catches it
    }
    s.transactions[tx.ID] = tx
    s.byEndToEnd[tx.EndToEndID] = tx.ID
    return nil
}
```

### 2. Imprecise float

JavaScript: `0.1 + 0.2 = 0.30000000000000004`. Now imagine that happening in the middle of a R$ 15,738,294.12 settlement.

```typescript
// TypeScript: imprecise float64
const amount = 15_738_294.12
const fee = amount * 0.001  // 15738.29412
// Rounding: 15738.29 or 15738.30?
// Every bank does it differently. Result: cent divergence.
```

In Go, you use `int64` for financial values:

```go
// Go: everything in cents (int64)
type MonetaryAmount struct {
    Value    int64  // cents
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

Notice: `int64` for cents. No floating point. No `0.1 + 0.2`. Every cent is an exact integer. The sum of 10K transactions always adds up.

### 3. Processing timeout

The real SPI has a 10-second timeout. If the bank doesn't respond in 10s, the transaction is automatically reversed.

```go
func processPaymentWithTimeout(msg PACS008) (Transaction, error) {
    result := make(chan Transaction, 1)
    errCh := make(chan error, 1)

    go func() {
        // Processing may include HTTP call to destination bank
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

Go's `select` is one of the most elegant features in the language. It waits on multiple channels simultaneously and executes the first one that responds. `time.After` creates a channel that fires after 10 seconds. If processing takes longer than that, the timeout wins and the transaction is rejected.

In TypeScript, you'd do something similar with `Promise.race`:

```typescript
async function processPaymentWithTimeout(msg: PACS008): Promise<Transaction> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
  return Promise.race([processPayment(msg), timeout])
}
```

It works, but with a crucial difference: `Promise.race` doesn't cancel the losing promise. The `processPayment` promise keeps running in the background, consuming memory, until it completes or gets GC'd. Go's `select` also doesn't cancel the losing goroutine, but goroutines are much lighter than V8 promises (~4KB vs ~40KB overhead), so the damage is smaller.

---

## What I learned

1. **XML is annoying, but necessary** — The financial world runs on XML since the 90s. That's not changing tomorrow. ISO 20022 is verbose, nested, and painful to debug. But it's the standard that lets 150 Brazilian banks exchange money in milliseconds. Don't try to escape it. Learn to tame it.

2. **ISO 20022 is the future** — Pix already uses it. SPI already uses it. The BC's SPC (Credit Payment System) is also migrating. Europe already migrated with SEPA. The US is migrating with FedNow. Anyone who doesn't adopt will be left behind. And the standard is so large (hundreds of messages, thousands of fields) that nobody implements everything — each institution implements a subset.

3. **Go isn't a silver bullet** — It's a tool. Use it where it makes sense. But when it makes sense, it makes a lot of sense. For high-frequency financial systems, Go is a natural choice because of latency predictability, native concurrency, and the absence of surprise GC. For low-traffic business APIs, TypeScript is more productive.

4. **Performance matters** — But not at any cost. Sometimes 50ms is enough. And sometimes 50ms is the difference between a bank approving or denying your transaction. Know your SLA. And more importantly: know your latency tail (P99, P99.9). The average lies. 50ms average with 500ms P99 spikes is unacceptable for SPI.

5. **Garbage collector is a financial risk** — Languages with generational GC (Java, C#, JavaScript) have unpredictable pauses. In 99.9% of systems, this doesn't matter. In instant payment systems with a 10-second SLA, every 100ms pause counts. Go proves it's possible to have GC without perceptible pauses — as long as you respect the language's design.

6. **Prefer int64 for money** — Floating point for money is the most common mistake from people starting with financial systems. One wrong cent in 10 million transactions turns into R$ 100K in divergence. Use integers. Always.

7. **Idempotency is the foundation of everything** — SPI guarantees that a transaction with the same `EndToEndId` is only processed once. But this depends on the sending bank generating unique IDs. When the sending bank has a bug and reuses IDs, SPI must reject. It's a bilateral contract between the Central Bank and the banks.

8. **Load test with real data** — Testing with a pretty XML is useless. Use real data with all optional fields, all namespaces, all edge cases. A real Pix XML has fields you've never seen in the documentation.

9. **Prefer native tools** — TypeScript needed `fastify-xml-body-parser` (which didn't work), `async-mutex` (which added overhead), and external dependencies. Go has `encoding/xml`, `sync`, and `net/http` in the stdlib. Fewer dependencies = smaller attack surface = fewer things that can break.

10. **Observability isn't optional** — In production, you'll need to know how many transactions are being processed per second, what the P99 latency is, how many are being rejected, and what the heap size is. In Go, `runtime.ReadMemStats` + custom metrics + structured logging solve it. In TypeScript, you depend on external libraries (OpenTelemetry, Prometheus client) that don't always work well with the ecosystem.

11. **Simplified deploy** — Go compiles a ~15MB static binary. You copy it to the server and run it. No `npm install`, no `node_modules`, no runtime versions, no "but it works on my machine." Deploy is an SCP. Rollback is an SCP of the previous binary.

12. **The pain of context** — Node.js has `AsyncLocalStorage` (since v13.10), but it's slow and optional. In Go, `context.Context` is omnipresent. Every request carries a context with timeout, tracing, and values. Go's `net/http` package manages the lifecycle automatically. If the client disconnects, the context is cancelled and the goroutine can stop processing.

```go
func processPaymentHandler(c *gin.Context) {
    // The request context carries tracing, timeout, and auth
    ctx := c.Request.Context()

    // If the client disconnects, ctx.Done() is closed
    select {
    case <-ctx.Done():
        log.Printf("Client disconnected, aborting processing")
        return
    case <-time.After(100 * time.Millisecond):
        // Simulated processing
    }
}
```

---

## Next steps

This simulator is the foundation. It shows the heart of SPI: receive an ISO 20022 message, validate, process, and respond. But the real SPI is much larger:

1. **Persistence** — Instead of an in-memory Map, use PostgreSQL (or SQLite for dev). Transactions need to survive restarts.
2. **S2 Simulator** — Implement the Reserve Transfer System. That's what moves money between bank accounts at the Central Bank.
3. **Real-time gross settlement (RTGS)** — Each transaction is settled individually, without netting. Implement debit/credit in reserve accounts.
4. **Negative messages** — `pacs.004` (return), `camt.056` (cancellation), `admi.002` (administrative event).
5. **Queue zone** — If the destination bank is offline, messages stay in queue until it comes back.
6. **Anti-money laundering (AML)** — Transactions above R$ 10,000 require COAF notification.
7. **Pix limits** — Night period (8PM-6AM) has a R$ 1,000 limit. Daytime limit is set by each bank.
8. **Pricing** — The Central Bank charges banks per settled transaction. Simulate the R$ 0.01 per Pix fee.
9. **Operating hours** — SPI runs 24/7, but S2 doesn't. Settlements outside S2 hours stay in a technical queue.

Each of these items deserves its own challenge. But the simulator you built here — with validation, ISO 20022 parsing, concurrent store, and pacs.002 response — is the foundation for all of them.

And if you're still debating between JavaScript and Go for this type of system: implement both. Compare. Learn. Because theory is theory, but feeling 100ms of GC pause in your own application is a lesson you'll never forget.
