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

O SPI precisa fazer 5 coisas em menos de 10 segundos:
1. Validar a transação (forma, fundos, limites)
2. Verificar se o banco do destino existe e aceita
3. Fazer a compensação entre os bancos
4. Notificar ambos os bancos
5. Se algo der errado, reverter

Tudo isso em XML. ISO 20022. Um padrão que veio pra ficar.

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

Mas o benefício real não é velocidade bruta. É **previsibilidade**. Go não tem garbage collector surpresa. A memória é gerenciada de forma determinística. Você sabe exatamente quando e quanto vai usar.

---

## O XML que o SPI engole

Toda transação Pix chega como um XML ISO 20022. É feio. É verboso. Mas é o padrão.

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

Cada campo importa:
- `MmbId` é o ISPB do banco (código de 8 dígitos)
- `EndToEndId` identifica a transação ponta a ponta
- `IntrBkSttlmAmt` é o valor em reais

---

## Os 4 endpoints

```go
r.POST("/spi/pacs.008", processPayment)        // Recebe crédito
r.GET("/spi/transactions", getTransactions)      // Lista transações
r.GET("/spi/transactions/:endToEndId", getByID)  // Consulta por ID
r.GET("/spi/health", healthCheck)                // Health check
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

---

## O que aprendi

1. **XML é chato, mas necessário** — O mundo financeiro roda em XML desde os anos 90. Não vai mudar amanhã.
2. **ISO 20022 é o futuro** — Pix já usa. SPI já usa. Quem não adotar vai ficar pra trás.
3. **Go não é bala de prata** — É uma ferramenta. Use onde faz sentido. Mas quando faz sentido, faz muito sentido.
4. **Performance importa** — Mas não a qualquer custo. Às vezes 50ms é suficiente. E às vezes 50ms é a diferença entre o banco aprovar ou não sua transação.
