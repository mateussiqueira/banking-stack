# Challenge 02 — SPI Simulator

**What is it:** A simulator for Brazil's Instant Payment System (SPI) from the Central Bank.

**Why it matters:** Every Pix transfer goes through SPI. It's the system that settles payments between banks in real-time.

## The problem

When you send a R$50 Pix from Nubank to Itaú, this happens:

```
Your phone → Nubank → SPI (Central Bank) → Itaú → Destination account
```

SPI needs to:
1. Validate the transaction
2. Check if the bank has funds
3. Settle the payment
4. Notify both banks
5. All of this in under 10 seconds

If SPI goes down, Pix goes down. If SPI is slow, Pix is slow. If SPI has bugs, money disappears.

## The architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SPI Simulator                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   pacs.008   │───▶│   Validation │───▶│   Store      │  │
│  │  (Credit)    │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   pacs.002   │◀───│   Status     │◀───│   Logger     │  │
│  │  (Report)    │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   pacs.004   │───▶│   Reversal   │                       │
│  │  (Return)    │    │              │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Why we started with TypeScript

The first version was Node.js + Fastify. It was ready in 2 hours. It worked. We tested it. We shipped it.

```typescript
// It was like this. Simple. Direct.
app.post('/spi/pacs.008', async (request, reply) => {
  const xml = request.body
  const result = processPayment(xml)
  return reply.send(result)
})
```

But then the problems started:

1. **XML parsing** — fastify-xml-body-parser didn't compile properly with strict TypeScript
2. **Performance** — 50ms per request isn't enough when you're processing 10,000 per second
3. **Memory** — 50MB of heap to basically do what Go does with 10MB

## Why we migrated to Go

Not because Go is "better". Because Go is more suitable for this specific case.

```
┌─────────────────────────────────────────────────────────────┐
│                    Comparison                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Metric          │ TypeScript      │ Go                      │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Startup time    │ ~2s             │ ~50ms                   │
│ Memory (idle)   │ ~50MB           │ ~10MB                   │
│ Latency/parse   │ ~5ms            │ ~0.2ms                  │
│ Throughput      │ ~2K req/s       │ ~50K req/s              │
│ Binary size     │ N/A (node)      │ ~15MB                   │
└─────────────────┴─────────────────┴─────────────────────────┘
```

The real benefit isn't just speed. It's predictability.

Node.js has a garbage collector. Sometimes it decides to pause everything for 100ms to clean memory. In a financial system, a 100ms pause can mean a lost transaction.

Go doesn't have that surprise. Memory is managed deterministically. You know exactly when and how much you'll use.

## The code

The SPI Simulator in Go has 4 main endpoints:

```go
// Receives pacs.008 (credit)
r.POST("/spi/pacs.008", processPayment)

// Lists transactions
r.GET("/spi/transactions", getTransactions)

// Query by EndToEndId
r.GET("/spi/transactions/:endToEndId", getTransactionByEndToEndID)

// Health check
r.GET("/spi/health", healthCheck)
```

Each transaction follows the ISO 20022 standard:

```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>PACS00820260626001</MsgId>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="BRL">150.00</TtlIntrBkSttlmAmt>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E202606260001</EndToEndId>
      </PmtId>
      <InstgAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>12345678</MmbId>  <!-- Sender bank ISPB -->
          </ClrSysMmbId>
        </FinInstnId>
      </InstgAgt>
      <CdtrAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>87654321</MmbId>  <!-- Receiver bank ISPB -->
          </ClrSysMmbId>
        </FinInstnId>
      </CdtrAgt>
      <IntrBkSttlmAmt Ccy="BRL">150.00</IntrBkSttlmAmt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

## How to test

```bash
# 1. Start SPI
cd packages/backend/spi-simulator-go
go run .

# 2. Send a transaction
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# 3. Check the transaction
curl http://localhost:3002/spi/transactions
```

## What we learned

1. **XML is annoying, but necessary** — The financial world runs on XML since the 90s. It's not changing tomorrow.
2. **ISO 20022 is the future** — Pix already uses it. SPI already uses it. Those who don't adopt will be left behind.
3. **Go isn't a silver bullet** — It's a tool. Use it where it makes sense.
4. **Performance matters** — But not at any cost. Sometimes 50ms is enough.
