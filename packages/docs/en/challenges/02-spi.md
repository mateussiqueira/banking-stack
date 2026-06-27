# Challenge 02 — SPI Simulator

**🇧🇷** Simulador do Sistema de Pagamentos Instantâneos  
**🇬🇧** Instant Payment System Simulator

---

Have you ever sent a Pix and stopped to think about what happens between tapping "confirm" and the money landing? Yeah. It's not magic. It's SPI.

SPI is the Instant Payment System from the Central Bank. It's the middleman between your bank and the recipient's bank. Every Pix transaction goes through it. If it goes down, Pix goes down. If it's slow, Pix is slow. If it has a bug, money vanishes.

This challenge is about building a simulator for it. And then rewriting it in Go because TypeScript couldn't handle it.

---

## The Problem

```
Your phone → Nubank → SPI (Central Bank) → Itaú → Destination account
```

SPI needs to do 5 things in under 10 seconds:
1. Validate the transaction (format, funds, limits)
2. Check if the destination bank exists and accepts it
3. Settle the payment between banks
4. Notify both banks
5. If something goes wrong, reverse it

All of this in XML. ISO 20022. A standard that's here to stay.

---

## Architecture

Every Pix transaction arrives as ISO 20022 XML. It's ugly. It's verbose. But it's the standard.

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
      <IntrBkSttlmAmt Ccy="BRL">150.00</IntrBkSttlmAmt>
      <InstgAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>12345678</MmbId>
          </ClrSysMmbId>
        </FinInstnId>
      </InstgAgt>
      <CdtrAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>87654321</MmbId>
          </ClrSysMmbId>
        </FinInstnId>
      </CdtrAgt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

Every field matters:
- `MmbId` is the bank's ISPB (8-digit code)
- `EndToEndId` identifies the transaction end-to-end
- `IntrBkSttlmAmt` is the amount in reais

The 4 endpoints:

```go
r.POST("/spi/pacs.008", processPayment)        // Receives credit
r.GET("/spi/transactions", getTransactions)      // Lists transactions
r.GET("/spi/transactions/:endToEndId", getByID)  // Query by ID
r.GET("/spi/health", healthCheck)                // Health check
```

---

## TypeScript Implementation

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

---

## Go Implementation

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

But the real benefit isn't raw speed. It's **predictability**. Go doesn't have surprise garbage collection. Memory is managed deterministically. You know exactly when and how much you'll use.

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

---

## Lessons Learned

1. **XML is annoying, but necessary** — The financial world has been running on XML since the 90s. That's not changing tomorrow.
2. **ISO 20022 is the future** — Pix already uses it. SPI already uses it. Anyone who doesn't adopt will be left behind.
3. **Go isn't a silver bullet** — It's a tool. Use it where it makes sense. But when it makes sense, it makes a lot of sense.
4. **Performance matters** — But not at any cost. Sometimes 50ms is enough. And sometimes 50ms is the difference between a bank approving or denying your transaction.
