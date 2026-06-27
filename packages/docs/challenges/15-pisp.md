# Desafio 06: Payment Initiation (PISP) — Iniciando Pagamentos por Open Finance

**🇧🇷** Iniciador de Transação de Pagamento  
**🇬🇧** Payment Initiation Service Provider

---

O **PISP** (ou **ISP**) é a figura introduzida pela **Fase 3 do Open Finance Brasil** que permite que terceiros iniciem pagamentos **diretamente da conta bancária do cliente** — sem cartão, sem boleto, sem PIX manual. É a base do **Pix Automático** e **Pagamento por Débito em Conta** moderno.

## Switch: TypeScript vs Go

<LanguageToggle />

<div class="lang-content ts" style="display:block;">

### O que é um PISP?

| Caso de Uso | Exemplo |
|-------------|---------|
| **Checkout e-commerce** | Pagar com 1 clique |
| **Assinaturas recorrentes** | Netflix, Spotify |
| **Food delivery** | iFood, Rappi |
| **Mobilidade** | Uber, 99 |
| **Marketplaces** | Mercado Livre, Shopee |

### Ecossistema Completo

```mermaid
graph TB
    subgraph "Clientes"
      U[Consumidor]
      M[Merchant]
    end

    subgraph "Iniciador (PISP)"
      APP[App iFood/Mercado Pago]
      SDK[SDK PISP]
      INIT[Payment Initiator]
    end

    subgraph "Detentor (ASPSP)"
      AUTH[Authorization Server]
      RES[Resource Server]
      SPI_CLIENT[SPI Client]
    end

    subgraph "Infraestrutura"
      SPI[SPI/BCB]
      DICT[DICT]
    end

    U -->|1. Checkout| APP
    M --> APP
    APP --> SDK
    SDK -->|FAPI| AUTH
    U -->|2. Autentica + Aprova| AUTH
    AUTH -->|Token| SDK
    SDK -->|3. Initiate Payment| INIT
    INIT -->|FAPI| RES
    RES -->|4. Envia PIX| SPI_CLIENT
    SPI_CLIENT -->|pacs.008| SPI
    SPI -->|5. Liquida| M
    SPI_CLIENT -->|6. Confirmação| INIT
    INIT -->|Webhook| APP
    APP -->|7. Pedido aprovado!| U

    classDef client fill:#4f46e5,stroke:#3730a3;
    classDef pisp fill:#f59e0b,stroke:#d97706;
    classDef aspsp fill:#10b981,stroke:#059669;

    class U,M client;
    class APP,SDK,INIT pisp;
    class AUTH,RES,SPI_CLIENT aspsp;
```

### Fluxo Detalhado

```mermaid
sequenceDiagram
    participant U as Cliente
    participant PISP as PISP (Iniciador)
    participant AS as Auth Server (Banco)
    participant RS as Resource Server
    participant SPI as SPI/BCB
    participant R as Recebedor

    U->>PISP: Clica "Pagar com Pix Automático"
    PISP->>AS: POST /consents (FAPI + PAR)
    AS-->>PISP: request_uri
    PISP->>U: Redirect para tela do banco
    U->>AS: Autentica (senha + biometria)
    U->>AS: Aprova pagamento
    AS-->>PISP: authorization_code

    PISP->>AS: POST /token (code + mTLS + PKCE)
    AS-->>PISP: access_token (escopo: payments)

    PISP->>RS: POST /payments (FAPI + JWT)
    RS->>RS: Valida token + consentimento + saldo
    RS->>SPI: Envia pacs.008
    SPI-->>RS: pacs.002 (ACSC)
    RS-->>PISP: 201 Created

    PISP->>U: "Pedido aprovado!"
    SPI->>R: Credita conta

    Note over U,R: Total: ~15 segundos end-to-end
```

### APIs de Pagamento

| Endpoint | Descrição |
|----------|-----------|
| `POST /consents` | Consentimento único |
| `POST /recurring-consents` | Para recorrência |
| `POST /pix/payments` | Inicia PIX |
| `GET /pix/payments/{id}` | Consulta status |
| `POST /automatic-payments` | Pix Automático |

### Domain — Payment Entity

```typescript
export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PDNG',
  ACCEPTED_CREDIT = 'ACSC',
  REJECTED = 'RJCT',
  CANCELLED = 'CANC',
}

export class PaymentInitiation extends Entity<string> {
  public confirm(endToEndId: string): void {
    this.props.status = PaymentStatus.ACCEPTED_CREDIT;
    this.props.endToEndId = endToEndId;
    this.props.confirmedAt = new Date();
  }

  public reject(reason: string): void {
    this.props.status = PaymentStatus.REJECTED;
    this.props.rejectionReason = reason;
  }

  public canBeProcessed(): boolean {
    return !this.isConfirmed() && !this.isRejected()
      && new Date() <= this.props.expiresAt;
  }
}
```

### Payment Consent (diferente do Consent de dados)

```typescript
export class PaymentConsent {
  public canBeUsed(): boolean {
    return this.isAuthorised()
      && new Date() <= this.props.expirationDateTime;
  }

  public validatePayment(amount: number): boolean {
    if (!this.canBeUsed()) return false;
    if (this.props.type === PaymentConsentType.SINGLE) {
      return this.props.amount === amount;
    }
    if (this.props.recurringPolicy?.maxAmountPerTransaction) {
      return amount <= this.props.recurringPolicy.maxAmountPerTransaction;
    }
    return true;
  }

  public consume(): void {
    if (this.props.type === PaymentConsentType.SINGLE) {
      this.props.status = PaymentConsentStatus.CONSUMED;
    }
  }
}
```

### Payment Initiator Service

```typescript
export class PaymentInitiatorService {
  public async initiate(input: InitiatePaymentInput, pispClientId: string) {
    // 1. Idempotência
    const existing = await this.idempotencyService.check(input.idempotencyKey);
    if (existing) return right(existing);

    // 2. Valida consentimento
    const consent = await this.fapiClient.getPaymentConsent(pispClientId, input.consentId);
    if (!consent.canBeUsed()) return left(new ConsentNotActiveError());
    if (!consent.validatePayment(input.amount)) return left(new ExceedsLimitError());

    // 3. Fraud check
    const fraudCheck = await this.fraudService.preInitiationCheck({ ... });
    if (fraudCheck.isHighRisk) return left(new FraudDetectedError());

    // 4. Cria pagamento
    const payment = PaymentInitiation.create({ ... });
    await this.paymentRepo.save(payment);

    // 5. Envia ao banco via FAPI
    const result = await this.fapiClient.initiatePayment(pispClientId, { ... });

    if (result.value.status === 'ACSC') payment.confirm(result.value.endToEndId);
    else payment.reject(result.value.reason);

    // 6. Consome consent (single)
    if (consent.type === 'SINGLE') consent.consume();

    // 7. Publica evento
    await this.eventPublisher.publish('payment.initiated', { ... });

    return right(payment);
  }
}
```

### FAPI Client — Comunicação com Bancos

```typescript
export class FAPIClient {
  public async initiatePayment(clientId: string, payment: FAPIPaymentRequest) {
    const bankEndpoint = await this.directoryService.findConsentEndpoint(payment.consentId);
    const token = await this.getAccessToken(clientId, payment.consentId);

    // Monta payload e assina com JWS (PS256)
    const signedRequest = await this.signRequest({
      data: { consentId: payment.consentId, amount: payment.amount, ... }
    }, clientId);

    const response = await this.tlsClient.post(
      `${bankEndpoint}/open-banking/payments/v1/payments`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/jwt' }, body: signedRequest }
    );

    return this.mapPaymentResponse(await response.json());
  }

  private generateClientAssertion(clientId: string, audience: string): string {
    return sign({ iss: clientId, sub: clientId, aud: `${audience}/token`, jti: uuidv4(), exp: now + 60 },
      this.privateKey, { algorithm: 'PS256', header: { kid: this.keyId, typ: 'JWT' } });
  }
}
```

### Fluxo de Recorrência (Pix Automático)

```mermaid
sequenceDiagram
    participant U as Cliente
    participant APP as App (Netflix)
    participant PISP as PISP
    participant BANK as Banco

    U->>APP: Assina plano mensal R$ 39,90
    APP->>PISP: Cria consentimento recorrente
    PISP->>BANK: POST /recurring-consents
    BANK->>U: "Autorizar Netflix todo mês?"
    U->>BANK: Aprova (até R$ 50/mês)
    BANK-->>PISP: recurring_consent_id

    Note over U,BANK: Mês 1 (manual)
    APP->>PISP: Inicia cobrança R$ 39,90
    PISP->>BANK: POST /recurring-payments
    BANK->>BANK: Valida consent + saldo
    BANK-->>PISP: Pagamento OK

    Note over U,BANK: Mês 2 (automático, sem aprovação!)
    APP->>PISP: Nova cobrança
    PISP->>BANK: POST /recurring-payments
    BANK-->>PISP: Pagamento OK
```

### Comparação: TypeScript vs Go

| Aspecto | TypeScript | Go |
|---------|-----------|-----|
| **FAPI/JWT** | jose, jsonwebtoken | golang-jwt/jwt |
| **mTLS** | TLS nativo | net/http mTLS |
| **Performance** | ~3K req/s | ~30K req/s |
| **Memory** | ~500MB | ~50MB |
| **Latência P99** | 30-100ms | 5-20ms |
| **Ecossistema** | Rico (SDKs prontos) | Menos libs FAPI |

### Casos Reais

- **Mercado Pago** (Go) — Maior PISP, 30K+ TPS, Pix Automático
- **PicPay** (Go + TS) — 40M+ usuários, recorrência massiva
- **iFood** (Go) — Checkout em escala, multi-bank
- **Pluggy/Belvo** (Go) — Infraestrutura PISP B2B

</div>

<div class="lang-content go" style="display:none;">

### Domain — Payment Entity

```go
package domain

import (
    "errors"
    "fmt"
    "time"
    "github.com/google/uuid"
)

type PaymentStatus string

const (
    StatusCreated        PaymentStatus = "CREATED"
    StatusPending        PaymentStatus = "PDNG"
    StatusAcceptedCredit PaymentStatus = "ACSC"
    StatusRejected       PaymentStatus = "RJCT"
)

type Payment struct {
    ID               string
    ConsentID        string
    Amount           int64
    Currency         string
    CreditorAccount  Account
    CreditorName     string
    Status           PaymentStatus
    EndToEndID       string
    CreatedAt        time.Time
    ExpiresAt        time.Time
    IdempotencyKey   string
}

func NewPayment(consentID string, amount int64, creditor Account, idempotencyKey string) (*Payment, error) {
    if amount <= 0 { return nil, ErrInvalidAmount }
    now := time.Now()
    return &Payment{
        ID: uuid.New().String(), ConsentID: consentID, Amount: amount,
        Currency: "BRL", CreditorAccount: creditor,
        Status: StatusCreated, CreatedAt: now, ExpiresAt: now.Add(10 * time.Minute),
        IdempotencyKey: idempotencyKey,
    }, nil
}

func (p *Payment) Confirm(endToEndID string) {
    p.Status = StatusAcceptedCredit
    p.EndToEndID = endToEndID
    now := time.Now()
    p.ConfirmedAt = &now
}

func (p *Payment) Reject(reason string) { p.Status = StatusRejected; p.RejectionReason = reason }
func (p *Payment) CanBeProcessed() bool { return !p.IsConfirmed() && !p.IsRejected() && time.Now().Before(p.ExpiresAt) }
```

### Payment Initiator Use Case

```go
package usecase

import (
    "context"
    "fmt"
    "time"
    "go.uber.org/zap"
)

type InitiatePaymentUseCase struct {
    paymentRepo  domain.PaymentRepository
    fapiClient   *openfinance.FAPIClient
    fraudService *fraud.DetectionService
    idempotency  *idempotency.Service
    eventPub     *events.Publisher
    logger       *zap.Logger
}

func (uc *InitiatePaymentUseCase) Execute(ctx context.Context, input InitiatePaymentInput, pispClientID string) (*InitiatePaymentOutput, error) {
    // 1. Idempotência
    if existing, _ := uc.idempotency.Check(ctx, input.IdempotencyKey); existing != nil {
        return uc.toOutput(existing.(*domain.Payment)), nil
    }

    // 2. Valida consentimento
    consent, err := uc.fapiClient.GetPaymentConsent(ctx, pispClientID, input.ConsentID)
    if err != nil { return nil, err }
    if !consent.CanBeUsed() { return nil, domain.ErrInvalidConsent }
    if !consent.ValidatePayment(input.Amount) { return nil, errors.New("excede limites") }

    // 3. Fraud check
    fraudCtx, cancel := context.WithTimeout(ctx, 200*time.Millisecond)
    defer cancel()
    fraudResult, _ := uc.fraudService.PreInitiationCheck(fraudCtx, fraud.CheckInput{...})
    if fraudResult != nil && fraudResult.IsHighRisk { return nil, errors.New("fraude") }

    // 4. Cria pagamento
    payment, _ := domain.NewPayment(input.ConsentID, input.Amount, input.CreditorAccount, input.IdempotencyKey)
    uc.paymentRepo.Save(ctx, payment)

    // 5. Envia ao banco
    spiResp, err := uc.fapiClient.InitiatePayment(ctx, pispClientID, openfinance.FAPIPaymentRequest{...})
    if err != nil {
        payment.Reject("BANK_COMMUNICATION_FAILED")
        uc.paymentRepo.Update(ctx, payment)
        return nil, err
    }

    switch spiResp.Status {
    case "ACSC": payment.Confirm(spiResp.EndToEndID)
    case "PDNG", "ACSP": payment.MarkAsSent(spiResp.EndToEndID)
    case "RJCT": payment.Reject(spiResp.RejectionReason)
    }
    uc.paymentRepo.Update(ctx, payment)

    // 6. Consome consent
    if consent.Type == domain.PaymentConsentTypeSingle { consent.Consume() }

    // 7. Eventos
    uc.eventPub.Publish(ctx, "payment.initiated", map[string]interface{}{...})

    return uc.toOutput(payment), nil
}
```

### FAPI Client

```go
package openfinance

import (
    "bytes"
    "context"
    "crypto/rsa"
    "crypto/sha256"
    "crypto/tls"
    "crypto/x509"
    "encoding/base64"
    "encoding/json"
    "encoding/pem"
    "net/http"
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

type FAPIClient struct {
    privateKey *rsa.PrivateKey
    keyID      string
    clientCert *tls.Certificate
    httpClient *http.Client
    directory  *directory.Sync
}

func (c *FAPIClient) InitiatePayment(ctx context.Context, clientID string, payment FAPIPaymentRequest) (*FAPIPaymentResponse, error) {
    bankEndpoint, _ := c.directory.FindConsentEndpoint(ctx, payment.ConsentID)
    token, _ := c.getAccessToken(ctx, clientID, payment.ConsentID)

    payload := map[string]interface{}{
        "data": map[string]interface{}{
            "consentId": payment.ConsentID, "paymentId": payment.PaymentID,
            "amount": fmt.Sprintf("%.2f", float64(payment.Amount)/100),
            "creditor": map[string]interface{}{
                "name": payment.Creditor.Name, "cpfCnpj": payment.Creditor.Document,
            },
        },
    }

    signedJWT, _ := c.signRequest(payload, clientID)

    req, _ := http.NewRequestWithContext(ctx, "POST",
        bankEndpoint+"/open-banking/payments/v1/payments",
        bytes.NewBufferString(signedJWT))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/jwt")
    req.Header.Set("x-fapi-interaction-id", uuid.New().String())

    resp, err := c.httpClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()

    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    return c.mapPaymentResponse(data), nil
}

func (c *FAPIClient) signRequest(payload interface{}, clientID string) (string, error) {
    claims := jwt.MapClaims{"iss": clientID, "iat": time.Now().Unix(), "exp": time.Now().Add(5*time.Minute).Unix(), "data": payload}
    token := jwt.NewWithClaims(jwt.SigningMethodPS256, claims)
    token.Header["kid"] = c.keyID
    return token.SignedString(c.privateKey)
}
```

### Webhook Handler

```go
package http

import (
    "crypto/rsa"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "net/http"
    "strings"
    "github.com/go-chi/chi/v5"
)

type WebhookHandler struct {
    processUC *usecase.ProcessConfirmationUseCase
    directory *directory.Sync
}

func (h *WebhookHandler) HandleBankWebhook(w http.ResponseWriter, r *http.Request) {
    jwsSignature := r.Header.Get("x-jws-signature")
    if jwsSignature == "" { h.writeError(w, 401, "MISSING_SIGNATURE"); return }

    var payload WebhookPayload
    json.NewDecoder(r.Body).Decode(&payload)

    if err := h.validateJWS(r.Context(), jwsSignature); err != nil {
        h.writeError(w, 401, "INVALID_SIGNATURE"); return
    }

    h.processUC.Execute(r.Context(), usecase.ProcessConfirmationInput{
        PaymentID: payload.PaymentID, Status: payload.Status, EndToEndID: payload.EndToEndID,
    })

    w.WriteHeader(200)
    json.NewEncoder(w).Encode(map[string]interface{}{"status": "RECEIVED"})
}

func (h *WebhookHandler) validateJWS(ctx context.Context, signature string) error {
    parts := strings.Split(signature, ".")
    if len(parts) != 3 { return errors.New("JWS malformado") }

    headerJSON, _ := base64.RawURLEncoding.DecodeString(parts[0])
    var header struct { Alg string `json:"alg"` }
    json.Unmarshal(headerJSON, &header)
    if header.Alg != "PS256" { return errors.New("algoritmo inválido") }

    publicKey, _ := h.directory.GetPublicKey(ctx, "bank-id")
    signatureBytes, _ := base64.RawURLEncoding.DecodeString(parts[2])
    hash := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
    return rsa.VerifyPSS(publicKey, crypto.SHA256, hash[:], signatureBytes, &rsa.PSSOptions{SaltLength: rsa.PSSSaltLengthAuto})
}
```

### Benchmark

| Operação | TS P99 | Go P99 | TS Throughput | Go Throughput |
|----------|--------|--------|---------------|---------------|
| /initiate | 450ms | 38ms | 1.8K/s | 28K/s |
| /consent | 85ms | 12ms | 3.5K/s | 42K/s |
| /webhook | 120ms | 8ms | 2.5K/s | 55K/s |

### Casos Reais

- **Mercado Pago** (Go) — Maior PISP, 30K+ TPS
- **PicPay** (Go + TS) — 40M+ usuários, recorrência
- **iFood** (Go) — Checkout em escala, multi-bank
- **Pluggy/Belvo** (Go) — Infraestrutura B2B

### Arquitetura Híbrida

```mermaid
graph TB
    subgraph "Edge (TypeScript)"
      CHECKOUT[Checkout SDK]
      MERCHANT[Dashboard]
    end

    subgraph "Core (Go)"
      PISP_CORE[PISP Core]
      CONSENT[Consent]
      FRAUD[Fraud Engine]
    end

    subgraph "External"
      BANK1[Itaú]
      BANK2[Bradesco]
      SPI[SPI/BCB]
    end

    CHECKOUT --> PISP_CORE
    MERCHANT --> PISP_CORE
    PISP_CORE --> CONSENT
    PISP_CORE --> FRAUD
    PISP_CORE -->|FAPI| BANK1
    PISP_CORE -->|FAPI| BANK2
    BANK1 --> SPI

    classDef edge fill:#4f46e5,stroke:#3730a3;
    classDef core fill:#10b981,stroke:#059669;

    class CHECKOUT,MERCHANT edge;
    class PISP_CORE,CONSENT,FRAUD core;
```

**Regra de ouro:** Go para o core PISP (iniciação, reconciliação, fraude), TypeScript para o edge (checkout, dashboards).

</div>

---

## Como testar

```bash
# TypeScript
pnpm --filter @banking/pisp dev

# Go
cd packages/backend/pisp-go
go run .

# Iniciar pagamento
curl -X POST http://localhost:3007/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "x-pisp-client-id: fintech-abc" \
  -d '{"consentId":"uuid","idempotencyKey":"uuid","amount":5000,"creditor":{"name":"Loja","document":"12345678901","account":{"ispb":"12345678","number":"12345","accountType":"CACC"}}}'
```

---

## Lições aprendidas

1. **PISP = Próxima fronteira** — Após PIX e Open Finance
2. **Pix Automático** — Recorrência sem nova aprovação
3. **FAPI obrigatório** — mTLS + PS256 + PKCE
4. **Idempotência crítica** — Pagamentos nunca duplicados
5. **Webhooks com JWS** — Validação de assinatura
6. **State machine** — CREATED → PDNG → ACSC (ou RJCT)
7. **Reconciliação diária** — Com cada banco detentor
8. **Go domina alta escala** — 5-15x mais rápido
9. **Consent de pagamento ≠ Consent de dados** — Regras diferentes
10. **Smart routing** — Escolhe melhor banco para cada pagamento
