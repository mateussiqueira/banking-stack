# Desafio 02 — SPI Simulator

**O que é:** Um simulador do Sistema de Pagamentos Instantâneos (SPI) do Banco Central do Brasil.

**Por que existe:** Todo Pix que você manda passa pelo SPI. É ele que faz a compensação entre bancos em tempo real.

## O problema

Quando você manda um Pix de R$ 50 do Nubank pro Itaú, acontece isso:

```
Seu celular → Nubank → SPI (Banco Central) → Itaú → Conta de destino
```

O SPI precisa:
1. Validar a transação
2. Verificar se o banco tem saldo
3. Fazer a compensação
4. Notificar ambos os bancos
5. Tudo isso em menos de 10 segundos

Se o SPI cai, o Pix cai. Se o SPI é lento, o Pix é lento. Se o SPI tem bug, dinheiro some.

## A arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      SPI Simulator                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   pacs.008   │───▶│   Validação  │───▶│   Estoque    │  │
│  │  (Crédito)   │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   pacs.002   │◀───│   Status     │◀───│   Logger     │  │
│  │  (Relatório) │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   pacs.004   │───▶│   Reversão   │                       │
│  │  (Devolução) │    │              │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Por que começamos com TypeScript

A primeira versão foi em Node.js + Fastify. Ficou pronta em 2 horas. Funcionou. Testamos. Publicamos.

```typescript
// Era assim. Simples. Direto.
app.post('/spi/pacs.008', async (request, reply) => {
  const xml = request.body
  const result = processPayment(xml)
  return reply.send(result)
})
```

Mas aí começaram os problemas:

1. **Parsing de XML** — fastify-xml-body-parser não compilava direito com TypeScript estrito
2. **Performance** — 50ms por request não é suficiente quando você processa 10 mil por segundo
3. **Memória** — 50MB de heap pra fazer基本 o mesmo que Go faz com 10MB

## Por que migramos pra Go

Não porque Go é "melhor". Porque Go é mais adequado pra esse caso específico.

```
┌─────────────────────────────────────────────────────────────┐
│                    Comparação                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Métrica         │ TypeScript      │ Go                      │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Startup time    │ ~2s             │ ~50ms                   │
│ Memória (idle)  │ ~50MB           │ ~10MB                   │
│ Latência/pars   │ ~5ms            │ ~0.2ms                  │
│ Throughput      │ ~2K req/s       │ ~50K req/s              │
│ Binary size     │ N/A (node)      │ ~15MB                   │
└─────────────────┴─────────────────┴─────────────────────────┘
```

O benefício real não é só velocidade. É previsibilidade.

Node.js tem garbage collector. Às vezes ele decide pausar tudo por 100ms pra limpar memória. Em um sistema financeiro, 100ms de pause pode significar uma transação perdida.

Go não tem essa surpresa. A memória é gerenciada de forma determinística. Você sabe exatamente quando e quanto vai usar.

## O código

O SPI Simulator em Go tem 4 endpoints principais:

```go
// Recebe pacs.008 (crédito)
r.POST("/spi/pacs.008", processPayment)

// Lista transações
r.GET("/spi/transactions", getTransactions)

// Consulta por EndToEndId
r.GET("/spi/transactions/:endToEndId", getTransactionByEndToEndID)

// Health check
r.GET("/spi/health", healthCheck)
```

Cada transação segue o padrão ISO 20022:

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
            <MmbId>12345678</MmbId>  <!-- ISPB do banco remetente -->
          </ClrSysMmbId>
        </FinInstnId>
      </InstgAgt>
      <CdtrAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>87654321</MmbId>  <!-- ISPB do banco destinatário -->
          </ClrSysMmbId>
        </FinInstnId>
      </CdtrAgt>
      <IntrBkSttlmAmt Ccy="BRL">150.00</IntrBkSttlmAmt>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

## Como testar

```bash
# 1. Subir o SPI
cd packages/backend/spi-simulator-go
go run .

# 2. Mandar uma transação
curl -X POST http://localhost:3002/spi/pacs.008 \
  -H "Content-Type: application/xml" \
  -d @testdata/pacs008-example.xml

# 3. Ver a transação
curl http://localhost:3002/spi/transactions
```

## O que aprendemos

1. **XML é chato, mas necessário** — O mundo financeiro roda em XML desde os anos 90. Não vai mudar amanhã.
2. **ISO 20022 é o futuro** — O Pix já usa. O SPI já usa. Quem não adotar vai ficar pra trás.
3. **Go não é bala de prata** — É uma ferramenta. Use onde faz sentido.
4. **Performance importa** — Mas não a qualquer custo. Às vezes 50ms é suficiente.
