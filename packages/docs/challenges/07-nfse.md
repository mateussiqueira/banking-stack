# Desafio 07: Antecipação de Recebíveis — O Mercado de R$ 500 Bi que Move o Brasil

**🇧🇷** Crédito sobre Vendas Futuras  
**🇬🇧** Receivables Financing

---

A **Antecipação de Recebíveis** permite merchants receberem **hoje** vendas no cartão que só seriam pagas em 30, 60 ou 90 dias. Movimenta mais de **R$ 500 bilhões por ano** e é a principal receita de Stone, PagSeguro e Mercado Pago.

## Switch: TypeScript vs Go

<LanguageToggle />

<div class="lang-content ts" style="display:block;">

### O que é Antecipação?

| Conceito | Descrição |
|----------|-----------|
| **D+30** | Prazo padrão de recebimento (30 dias) |
| **MDR** | Taxa do adquirente (1,5-3% por transação) |
| **Spread** | Margem do banco na antecipação (2-8% a.a.) |
| **IOF** | Imposto: 0,38% + 0,0041% ao dia |
| **CET** | Custo Efetivo Total anualizado |
| **FIDC** | Fundo de Investimento em Direitos Creditórios |

### Matemática da Antecipação

```typescript
// Cálculo de antecipação de R$ 10.000 em 30 dias
const valorFuturo = 10000;
const dias = 30;
const taxaAnual = 0.18; // 18% a.a. (CDI + spread)
const iof = 0.0038 + (0.000041 * dias);
const taxaFixa = 10;

const taxaDiaria = Math.pow(1 + taxaAnual, 1/365) - 1;
const desconto = valorFuturo * (Math.pow(1 + taxaDiaria, dias) - 1);
const valorIOF = valorFuturo * iof;
const valorLiquido = valorFuturo - desconto - valorIOF - taxaFixa;

// Valor Líquido: R$ 9.795,33
// CET: 18.00% a.a.
```

### Fluxo Completo

```mermaid
sequenceDiagram
    participant M as Merchant
    participant Q as Quote Engine
    participant R as Risk Engine
    participant P as Pricing
    participant C as Contract
    participant L as Liquidation
    participant CIP as CIP/Bacen

    M->>Q: "Quero antecipar R$ 50.000"
    Q->>R: Avalia risco do merchant
    R-->>Q: Score: A (baixo risco)
    Q->>P: Calcula taxa personalizada
    P-->>Q: Taxa: 16,5% a.a.
    Q-->>M: Quote: R$ 48.500 hoje

    M->>C: Confirma antecipação
    C->>C: Reserva recebíveis (lock)
    C->>C: Gera contrato
    C->>L: Liquidação
    L->>CIP: Transfere R$ 48.500
    L->>M: Credita conta

    Note over L,CIP: Quando cliente pagar a venda original...
    CIP->>L: Recebe R$ 50.000 (D+30)
    L->>L: Quita antecipação + lucro R$ 1.500
```

### Arquitetura

```mermaid
graph TB
    subgraph "Merchants"
      M1[Loja Física]
      M2[E-commerce]
    end

    subgraph "Core"
      QUOTE[Quote Engine]
      RISK[Risk Engine]
      PRICING[Pricing Engine]
      CONTRACT[Contract Manager]
    end

    subgraph "Data"
      CARD_TX[Card Transactions]
      CREDIT_BUREAU[Serasa/Boa Vista]
    end

    subgraph "External"
      CIP[CIP - Câmara]
      BACEN[Banco Central]
      FUNDING[Funding Banks]
    end

    M1 --> QUOTE
    M2 --> QUOTE
    QUOTE --> RISK
    QUOTE --> PRICING
    RISK --> CREDIT_BUREAU
    CONTRACT --> CIP
    CONTRACT --> FUNDING

    classDef merchant fill:#4f46e5,stroke:#3730a3;
    classDef core fill:#10b981,stroke:#059669;
    classDef data fill:#6366f1,stroke:#4f46e5;
    classDef external fill:#dc2626,stroke:#b91c1c;

    class M1,M2 merchant;
    class QUOTE,RISK,PRICING,CONTRACT core;
    class CARD_TX,CREDIT_BUREAU data;
    class CIP,BACEN,FUNDING external;
```

### Pricing Engine

```typescript
export class PricingEngine {
  public async calculateQuote(merchantId: string, receivables: Receivable[]) {
    const cdiRate = await this.marketData.getCDIRate();
    const riskPremium = this.calculateRiskPremium(merchant);
    const spread = this.calculateSpread(merchant);
    const totalRate = cdiRate + spread + riskPremium;

    let grossAmount = 0, discountAmount = 0, iofAmount = 0;

    for (const r of receivables) {
      const days = r.daysUntilPayment();
      const dailyRate = Math.pow(1 + totalRate, 1/365) - 1;
      const discount = r.netAmount * (Math.pow(1 + dailyRate, days) - 1);
      const iof = r.netAmount * (0.0038 + 0.000041 * days);

      grossAmount += r.netAmount;
      discountAmount += discount;
      iofAmount += iof;
    }

    return {
      grossAmount, discountAmount, iofAmount,
      netAmount: grossAmount - discountAmount - iofAmount - 10,
      effectiveRate: this.calculateCET(grossAmount, grossAmount - discountAmount - iofAmount, avgDays),
    };
  }

  private calculateRiskPremium(merchant: Merchant): number {
    const ratingFactors: Record<string, number> = {
      'AAA': 0.000, 'AA': 0.005, 'A': 0.010,
      'BBB': 0.020, 'BB': 0.035, 'B': 0.050, 'CCC': 0.080,
    };
    let risk = ratingFactors[merchant.creditRating] || 0.10;
    if (merchant.chargebackRate > 0.02) risk += 0.02;
    if (this.monthsSince(merchant.createdAt) < 6) risk += 0.015;
    return risk;
  }
}
```

### Risk Engine

```typescript
export class RiskEngine {
  public async evaluate(input: RiskEvaluationInput) {
    const creditData = await this.creditBureau.query({ document: merchant.document });
    const history = await this.historyRepo.findByMerchant(input.merchantId, { months: 12 });
    const fraudCheck = await this.fraudService.evaluateAnticipation({ ... });

    const finalScore = Math.round(
      creditData.score * 0.35 +
      this.calculateHistoryScore(history) * 0.30 +
      this.calculateBehaviorScore(merchant, input) * 0.20 +
      fraudCheck.score * 0.15
    );

    return {
      approved: finalScore >= 500 && input.totalAmount <= limits.maxAmount,
      score: finalScore,
      riskLevel: finalScore >= 800 ? 'LOW' : finalScore >= 650 ? 'MEDIUM' : 'HIGH',
    };
  }
}
```

### Comparação: TypeScript vs Go

| Aspecto | TypeScript | Go |
|---------|-----------|-----|
| **Math** | Number (ok) | shopspring/decimal |
| **Batch** | Worker threads | Goroutines |
| **1M recebíveis** | ~14 minutos | ~80 segundos |
| **Quote P99** | 180-1200ms | 45-280ms |
| **Memory** | ~2GB | ~100MB |

### Casos Reais

- **Stone** (Go) — Líder, R$ 100+ bi/ano, P99 < 200ms
- **PagSeguro** (Go + Java) — 40M clientes, auto-antecipação
- **Mercado Pago** (Go) — Maior da Latam, dynamic pricing
- **Creditas** (Go) — Nicho PME, FIDC próprio

</div>

<div class="lang-content go" style="display:none;">

### Domain — Receivable Entity

```go
package domain

import (
    "errors"
    "time"
    "github.com/google/uuid"
)

type ReceivableStatus string

const (
    StatusPending     ReceivableStatus = "PENDING"
    StatusPaid        ReceivableStatus = "PAID"
    StatusAnticipated ReceivableStatus = "ANTECIPATED"
    StatusChargedBack ReceivableStatus = "CHARGED_BACK"
)

type Receivable struct {
    ID                string
    MerchantID        string
    CardBrand         string
    GrossAmount       int64 // centavos
    NetAmount         int64 // após MDR
    PaymentDate       time.Time
    Status            ReceivableStatus
}

func (r *Receivable) DaysUntilPayment(from time.Time) int {
    days := int(time.Until(r.PaymentDate).Hours() / 24)
    if days < 0 { days = 0 }
    return days
}

func (r *Receivable) CanBeAnticipated() bool {
    return r.Status == StatusPending && r.DaysUntilPayment(time.Now()) > 0
}
```

### Pricing Engine com decimal

```go
package pricing

import (
    "context"
    "math"
    "github.com/shopspring/decimal"
)

type Engine struct {
    merchantRepo  MerchantRepository
    marketData    MarketDataService
}

func (e *Engine) CalculateQuote(ctx context.Context, merchantID string, receivables []*domain.Receivable) (*QuoteResult, error) {
    cdiRate, _ := e.marketData.GetCDIRate(ctx)
    riskPremium := e.calculateRiskPremium(merchant)
    spread := e.calculateSpread(merchant)

    totalRate := cdiRate.Add(spread).Add(riskPremium)
    one := decimal.NewFromInt(1)
    dailyRate := one.Add(totalRate).Pow(one.Div(decimal.NewFromInt(365))).Sub(one)

    var grossAmount, discountAmount, iofAmount int64
    var weightedDays, totalWeight int64

    for _, r := range receivables {
        days := int64(r.DaysUntilPayment(time.Now()))
        factor := one.Add(dailyRate).Pow(decimal.NewFromInt(days))
        discount := decimal.NewFromInt(r.NetAmount).Mul(factor.Sub(one))
        iof := decimal.NewFromInt(r.NetAmount).Mul(decimal.NewFromFloat(0.0038 + 0.000041*float64(days)))

        grossAmount += r.NetAmount
        discountAmount += discount.IntPart()
        iofAmount += iof.IntPart()
        weightedDays += days * r.NetAmount
        totalWeight += r.NetAmount
    }

    netAmount := grossAmount - discountAmount - iofAmount - 10
    avgDays := weightedDays / totalWeight
    effectiveRate := math.Pow(float64(grossAmount)/float64(netAmount), 365.0/float64(avgDays)) - 1.0

    return &QuoteResult{
        GrossAmount: grossAmount, NetAmount: netAmount,
        DiscountAmount: discountAmount, IOFAmount: iofAmount,
        EffectiveRate: effectiveRate, DaysToReceive: int(avgDays),
    }, nil
}
```

### Anticipation Use Case

```go
package usecase

func (uc *AnticipateUseCase) Execute(ctx context.Context, input AnticipateInput) (*AnticipateOutput, error) {
    // 1. Idempotência
    if existing, _ := uc.idempotency.Check(ctx, input.IdempotencyKey); existing != nil {
        return existing.(*AnticipateOutput), nil
    }

    // 2. Busca recebíveis
    receivables := make([]*domain.Receivable, 0, len(input.ReceivableIDs))
    for _, id := range input.ReceivableIDs {
        r, _ := uc.receivableRepo.FindByID(ctx, id)
        if r == nil { return nil, domain.ErrReceivableNotFound }
        if r.MerchantID != input.MerchantID { return nil, domain.ErrInvalidOwnership }
        receivables = append(receivables, r)
    }

    // 3. Risk evaluation
    riskResult, _ := uc.riskEngine.Evaluate(ctx, risk.EvaluationInput{...})
    if !riskResult.Approved { return nil, errors.New("rejeitado pelo risco") }

    // 4. Pricing
    quote, _ := uc.pricingEngine.CalculateQuote(ctx, input.MerchantID, receivables)

    // 5. Cria contrato + lock recebíveis + funding + credita merchant
    contract := domain.NewAnticipationContract(...)
    uc.receivableRepo.LockForAnticipation(ctx, ids, contract.ID)
    uc.fundingService.RequestFunding(ctx, funding.Request{Amount: quote.NetAmount})
    uc.ledgerService.Credit(ctx, ledger.CreditRequest{Amount: quote.NetAmount})

    // 6. Eventos
    uc.eventPub.Publish(ctx, "anticipation.completed", map[string]interface{}{...})

    return &AnticipateOutput{ContractID: contract.ID, NetAmount: quote.NetAmount}, nil
}
```

### Batch Processor

```go
package jobs

func (p *DailyReceivableProcessor) Execute(ctx context.Context, date time.Time) error {
    files, _ := p.acquirerClient.DownloadReconciliationFiles(ctx, date)

    var wg sync.WaitGroup
    sem := make(chan struct{}, 50) // 50 workers paralelos

    for _, file := range files {
        wg.Add(1)
        go func(f AcquirerFile) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            p.processFile(ctx, f)
        }(file)
    }
    wg.Wait()
    return nil
}
```

### Benchmark

| Operação | TS | Go |
|----------|----|----|
| Quote (10 receiváveis) | 45ms | 12ms |
| Quote (1K receiváveis) | 850ms | 140ms |
| Batch 1M recebíveis | ~14min | ~80s |
| Memory por instância | ~2GB | ~100MB |

### Casos Reais

- **Stone** (Go) — Líder, 30K+ TPS, batch 50M+/dia
- **PagSeguro** (Go + Java) — 40M clientes, auto-antecipação
- **Mercado Pago** (Go) — Maior Latam, dynamic pricing
- **Creditas** (Go) — Nicho PME, FIDC próprio

</div>

---

## Como testar

```bash
# TypeScript
pnpm --filter @banking/anticipation dev

# Go
cd packages/backend/anticipation-go
go run .

# Simular cotação
curl -X POST http://localhost:3010/anticipation/quote \
  -H "Content-Type: application/json" \
  -d '{"receivableIds":["uuid1","uuid2"]}'
```

---

## Lições aprendidas

1. **R$ 500+ bi/ano** — Maior mercado de crédito do Brasil
2. **Matemática precisa é crítica** — Centavos importam em escala
3. **shopspring/decimal** — Nunca float nativo pra dinheiro em Go
4. **Batch processing** — 50M+ recebíveis/dia em grandes adquirentes
5. **Risk engine multi-camada** — Crédito + histórico + comportamento + fraude
6. **Funding sources** — Capital próprio, FIDCs, bancos atacadistas
7. **Chargeback é o maior risco** — Merchant pode sumir
8. **CET precisa ser divulgado** — Exigência BACEN
9. **Go processa 1M em 80s** — vs 14min em TypeScript
10. **Stone, PagSeguro e Mercado Pago** — Todos usam Go no core
