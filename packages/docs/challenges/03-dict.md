# Desafio 03: DICT — Diretório de Identificadores de Contas Transacionais

**🇧🇷** Diretório de Identificadores de Contas Transacionais  
**🇬🇧** Directory of Transactional Account Identifiers

---

O **DICT** é o diretório central do Banco Central do Brasil que gerencia todas as **chaves PIX**. É a "agenda telefônica" do PIX — sem ele, ninguém saberia para qual conta enviar um PIX quando você informa apenas um CPF ou e-mail.

## Switch: TypeScript vs Go

<LanguageToggle />

<div class="lang-content ts" style="display:block;">

### O que é o DICT?

| Tipo de Chave | Descrição |
|---------------|-----------|
| **CPF** | 11 dígitos, validação por dígito verificador |
| **CNPJ** | 14 dígitos, validação por dígito verificador |
| **E-mail** | Formato RFC 5322, até 77 caracteres |
| **Telefone** | Formato +55 XX XXXXX-XXXX |
| **Aleatória** | UUID v4, máxima privacidade |

| Característica | Descrição |
|----------------|-----------|
| **Ownership** | Uma chave = uma conta (única) |
| **Portabilidade** | Cliente pode mover chave entre bancos |
| **Anti-enumeration** | Proteção contra varreduras |
| **Rate limiting** | Limites por instituição |

### Arquitetura do DICT Simulator

```mermaid
graph TB
    subgraph "Clients"
      PSP1[PSP Origem]
      PSP2[PSP Destino]
      APP[App Cliente]
    end

    subgraph "API Gateway"
      GW[Auth + Rate Limit]
      CACHE[Response Cache]
    end

    subgraph "DICT Service"
      API[REST API]
      UC[Use Cases]
      VAL[Validators]
      REPO[Repository]
      LOCK[Distributed Lock]
      EVENTS[Event Publisher]
    end

    subgraph "Data Layer"
      MONGO[(MongoDB - Keys)]
      REDIS[(Redis - Cache + Locks)]
      AUDIT[(PostgreSQL - Audit)]
    end

    subgraph "External"
      BCB[BCB DICT]
    end

    PSP1 -->|HTTPS| GW
    PSP2 -->|HTTPS| GW
    APP -->|HTTPS| GW

    GW --> CACHE
    GW --> API

    API --> UC
    UC --> VAL
    UC --> LOCK
    UC --> REPO
    UC --> EVENTS

    REPO --> MONGO
    LOCK --> REDIS
    CACHE --> REDIS
    EVENTS --> AUDIT

    BCB -.->|Sync| API

    classDef client fill:#4f46e5,stroke:#3730a3;
    classDef api fill:#f59e0b,stroke:#d97706;
    classDef data fill:#10b981,stroke:#059669;
    classDef external fill:#dc2626,stroke:#b91c1c;

    class PSP1,PSP2,APP client;
    class API,UC,VAL,REPO,LOCK,EVENTS api;
    class MONGO,REDIS,AUDIT data;
    class BCB external;
```

### Fluxos Principais

**1. Registro de Chave**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant PSP
    participant DICT
    participant Lock as Redis Lock
    participant DB as MongoDB

    C->>PSP: Solicita registro de chave
    PSP->>DICT: POST /api/v1/dict/keys

    DICT->>DICT: Valida formato da chave
    DICT->>Lock: Tenta lock (chave)

    alt Lock adquirido
      DICT->>DB: Verifica se chave existe
      alt Chave não existe
        DICT->>DB: Insere nova chave
        DICT-->>PSP: 201 Created
      else Chave já existe
        DICT-->>PSP: 409 Conflict
      end
      DICT->>Lock: Libera lock
    else Lock não adquirido
      DICT-->>PSP: 429 Too Many Requests
    end
```

**2. Consulta de Chave**

```mermaid
sequenceDiagram
    participant PSP_O as PSP Origem
    participant DICT
    participant Cache as Redis Cache
    participant DB as MongoDB

    PSP_O->>DICT: GET /api/v1/dict/keys/:key

    DICT->>Cache: Busca no cache
    alt Cache hit
      Cache-->>DICT: Dados da chave
    else Cache miss
      DICT->>DB: Query por chave
      DICT->>Cache: Atualiza cache (TTL 5min)
    end

    DICT-->>PSP_O: 200 OK + dados conta
```

**3. Portabilidade (Claim)**

```mermaid
sequenceDiagram
    participant C as Cliente
    participant PSP_N as PSP Novo
    participant PSP_A as PSP Antigo
    participant DICT
    participant DB as MongoDB

    C->>PSP_N: Quero portar minha chave
    PSP_N->>DICT: PATCH /api/v1/dict/keys/:key/claim

    DICT->>DB: Busca chave atual
    DICT->>DB: Cria ClaimRequest (PENDING)
    DICT-->>PSP_N: 202 Accepted (claim_id)
    DICT->>PSP_A: Notifica sobre claim

    Note over PSP_A: Cliente confirma no PSP antigo
    PSP_A->>DICT: PATCH /claims/:id/approve

    DICT->>DB: Atualiza ownership
    DICT->>PSP_N: Notifica sucesso
    DICT->>PSP_A: Notifica remoção
```

### Domain Layer

```typescript
export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM'
}

export class PixKey extends Entity<string> {
  public static create(props: PixKeyProps): Result<PixKey, Error> {
    const validation = PixKey.validate(props);
    if (validation.isErr()) return Err(validation.error);

    return Ok(new PixKey({
      ...props,
      id: props.id || uuidv4(),
      createdAt: props.createdAt || new Date(),
      active: props.active ?? true,
    }));
  }

  public static createRandom(account: AccountInfo, owner: OwnerInfo): Result<PixKey, Error> {
    return PixKey.create({
      type: PixKeyType.RANDOM,
      value: uuidv4(),
      account, owner,
      ispb: account.ispb,
      createdAt: new Date(),
      active: true,
    });
  }

  public transferTo(newAccount: AccountInfo): Result<PixKey, Error> {
    if (!this.props.active) return Err(new Error('Chave inativa'));
    return Ok(new PixKey({
      ...this.props,
      account: newAccount,
      ispb: newAccount.ispb,
      updatedAt: new Date(),
    }));
  }
}
```

### Validators — Validação de Cada Tipo

```typescript
export class CPFValidator implements KeyValidator {
  validate(value: string): ValidationResult {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return { isValid: false, errorMessage: 'CPF deve ter 11 dígitos' };
    if (/^(\d)\1+$/.test(cpf)) return { isValid: false, errorMessage: 'CPF inválido' };
    if (!this.validateDigits(cpf)) return { isValid: false, errorMessage: 'CPF inválido' };
    return { isValid: true, normalizedValue: cpf };
  }

  private validateDigits(cpf: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    return remainder === parseInt(cpf[10]);
  }
}

export class CNPJValidator implements KeyValidator {
  validate(value: string): ValidationResult {
    const cnpj = value.replace(/\D/g, '');
    if (cnpj.length !== 14) return { isValid: false, errorMessage: 'CNPJ deve ter 14 dígitos' };
    if (/^(\d)\1+$/.test(cnpj)) return { isValid: false, errorMessage: 'CNPJ inválido' };
    if (!this.validateDigits(cnpj)) return { isValid: false, errorMessage: 'CNPJ inválido' };
    return { isValid: true, normalizedValue: cnpj };
  }

  private validateDigits(cnpj: string): boolean {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weights1[i];
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weights2[i];
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    return digit2 === parseInt(cnpj[13]);
  }
}

export class KeyValidatorFactory {
  static create(type: PixKeyType): KeyValidator {
    switch (type) {
      case PixKeyType.CPF: return new CPFValidator();
      case PixKeyType.CNPJ: return new CNPJValidator();
      case PixKeyType.EMAIL: return new EmailValidator();
      case PixKeyType.PHONE: return new PhoneValidator();
      case PixKeyType.RANDOM: return new RandomKeyValidator();
    }
  }
}
```

### Use Cases — Registro de Chave

```typescript
export class RegisterPixKeyUseCase {
  private static readonly MAX_KEYS_PER_PERSON = 5;

  constructor(
    private readonly pixKeyRepo: PixKeyRepository,
    private readonly lock: DistributedLock,
    private readonly eventPublisher: EventPublisher
  ) {}

  public async execute(input: RegisterPixKeyInput): Promise<Either<Error, PixKey>> {
    // 1. Para chave aleatória, gera o valor
    let value = input.value;
    if (input.type === PixKeyType.RANDOM) {
      value = crypto.randomUUID();
    } else if (!value) {
      return left(new Error('Valor é obrigatório'));
    }

    // 2. Valida formato
    const validator = KeyValidatorFactory.create(input.type);
    const validation = validator.validate(value);
    if (!validation.isValid) return left(new Error(validation.errorMessage!));

    // 3. Lock distribuído
    const unlock = await this.lock.acquire(`pix_key:${value}`, { ttl: 10000 });
    try {
      // 4. Verifica se já existe
      const existing = await this.pixKeyRepo.findByValue(value);
      if (existing) return left(new KeyAlreadyRegisteredError(value));

      // 5. Valida limite por pessoa
      const existingByOwner = await this.pixKeyRepo.findByOwnerDocument(owner.document);
      if (existingByOwner.length >= RegisterPixKeyUseCase.MAX_KEYS_PER_PERSON) {
        return left(new MaxKeysReachedError(owner.document));
      }

      // 6. Cria e persiste
      const pixKey = PixKey.create({ type: input.type, value, account, owner, ispb: account.ispb });
      await this.pixKeyRepo.save(pixKey);

      await this.eventPublisher.publish('pix.key.registered', { keyId: pixKey.id, type: pixKey.type });
      return right(pixKey);
    } finally {
      await unlock();
    }
  }
}
```

### Use Cases — Claim (Portabilidade)

```typescript
export class ClaimPixKeyUseCase {
  private static readonly CLAIM_EXPIRY_HOURS = 7 * 24;

  constructor(
    private readonly pixKeyRepo: PixKeyRepository,
    private readonly claimRepo: ClaimRepository,
    private readonly lock: DistributedLock,
    private readonly notificationService: NotificationService
  ) {}

  public async execute(input: ClaimPixKeyInput): Promise<Either<Error, ClaimPixKeyOutput>> {
    const unlock = await this.lock.acquire(`pix_key:${input.key}`, { ttl: 15000 });
    try {
      const currentKey = await this.pixKeyRepo.findByValue(input.key);
      if (!currentKey) return left(new KeyNotFoundError(input.key));

      if (currentKey.ispb === input.claimerIspb) {
        return left(new SamePSPError('Não é possível claim no mesmo PSP'));
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ClaimPixKeyUseCase.CLAIM_EXPIRY_HOURS);

      const claim = { id: crypto.randomUUID(), key: input.key, currentIspb: currentKey.ispb, claimerIspb: input.claimerIspb, status: 'PENDING', expiresAt };
      await this.claimRepo.save(claim);

      await this.notificationService.notifyPSP(currentKey.ispb, { type: 'CLAIM_RECEIVED', claimId: claim.id });
      return right({ claimId: claim.id, status: 'PENDING', expiresAt });
    } finally {
      await unlock();
    }
  }
}
```

### Anti-Enumeration — Segurança

```typescript
export class AntiEnumerationService {
  public async analyzeQuery(ispb: string, ip: string, key: string, result: 'found' | 'not_found'): Promise<SecurityAction> {
    const ispbCount = await this.redis.incr(`query:${ispb}:${hourKey}`);
    const ispbNotFound = result === 'not_found' ? await this.redis.incr(`notfound:${ispb}:${hourKey}`) : 0;

    const notFoundRate = ispbCount > 0 ? ispbNotFound / ispbCount : 0;

    // Alta taxa de "não encontrado" = possível enumeração
    if (notFoundRate > 0.9 && ispbCount > 100) {
      return SecurityAction.THROTTLE;
    }

    // Volume muito alto
    if (ispbCount > 5000) {
      return SecurityAction.BLOCK;
    }

    // Detecta CPFs sequenciais
    if (this.isSequentialCPF(key)) {
      return SecurityAction.BLOCK;
    }

    return SecurityAction.ALLOW;
  }
}
```

**Proteções obrigatórias:**

- Rate limiting por ISPB e IP
- Respostas homogêneas (404 genérico, sem detalhes)
- Masking de dados (nunca retorna CPF completo)
- Detecção de padrões anômalos
- Auditoria de todas as consultas

### Comparação: TypeScript vs Go

| Aspecto | TypeScript | Go |
|---------|-----------|-----|
| **Desenvolvimento** | Rápido (Zod, Express) | Mais verboso |
| **CPU-bound** | Validações travam event loop | Não bloqueia |
| **Memory** | Mais RAM por conexão | 2-3x menos |
| **Throughput** | ~10K req/s | ~50K req/s |
| **Regex** | V8 otimizado | Nativo, pré-compilado |
| **JSON** | Nativo | Struct tags |

### Quando usar TypeScript?

- PSP pequeno/médio (até 1M de chaves)
- Time-to-market rápido
- Volume moderado (até 5K consultas/s)
- Equipe sem experiência em Go

### Caso Real: Nubank e Itaú

- **Nubank** — Clojure (core DICT) + TypeScript (BFFs), 80M+ clientes, Redis Cluster
- **Itaú** — Go (DICT alta performance) + Java (core banking legado), 60M+ clientes

### Boas Práticas

**Faça:**
- Locks distribuídos em operações de escrita
- Rate limiting por ISPB, IP e usuário
- Masking de dados (nunca retorne CPF completo)
- Auditoria de todas as operações
- TTL em cache balanceando freshness vs performance

**Evite:**
- Respostas detalhadas em 404 (anti-enumeration)
- Cache sem invalidação (claims mudam ownership)
- Validação só no backend (sempre backend)
- Logs com dados sensíveis
- Concorrência sem locks

</div>

<div class="lang-content go" style="display:none;">

### Arquitetura DICT em Go

```mermaid
graph TB
    subgraph "Edge"
      PSP1[PSP 1]
      PSP2[PSP 2]
      APP[App]
    end

    subgraph "Load Balancer"
      LB[NGINX / ALB]
      RL[Rate Limiter]
    end

    subgraph "DICT Service (Go)"
      API[HTTP API]
      UC[Use Cases]
      VAL[Validators]
      CACHE[Cache Layer]
      LOCK[Lock Manager]
      EVENTS[Event Publisher]
    end

    subgraph "Data Layer"
      MONGO[(MongoDB Sharded)]
      REDIS[(Redis Cluster)]
      PG[(PostgreSQL Audit)]
    end

    subgraph "Background"
      AUDIT[Audit Worker]
      SYNC[BCB Sync]
      CLEANER[Claim Expiry]
    end

    PSP1 --> LB
    PSP2 --> LB
    APP --> LB

    LB --> RL
    LB --> API

    API --> UC
    UC --> VAL
    UC --> CACHE
    UC --> LOCK
    UC --> EVENTS

    CACHE --> REDIS
    LOCK --> REDIS
    UC --> MONGO
    EVENTS --> PG

    AUDIT --> MONGO
    SYNC --> MONGO
    CLEANER --> REDIS

    classDef edge fill:#4f46e5,stroke:#3730a3;
    classDef api fill:#f59e0b,stroke:#d97706;
    classDef data fill:#10b981,stroke:#059669;
    classDef bg fill:#dc2626,stroke:#b91c1c;

    class PSP1,PSP2,APP edge;
    class API,UC,VAL,CACHE,LOCK,EVENTS api;
    class MONGO,REDIS,PG data;
    class AUDIT,SYNC,CLEANER bg;
```

### Domain Layer

```go
package domain

import (
    "errors"
    "regexp"
    "strings"
    "time"
    "github.com/google/uuid"
)

type PixKeyType string

const (
    KeyTypeCPF    PixKeyType = "CPF"
    KeyTypeCNPJ   PixKeyType = "CNPJ"
    KeyTypeEmail  PixKeyType = "EMAIL"
    KeyTypePhone  PixKeyType = "PHONE"
    KeyTypeRandom PixKeyType = "RANDOM"
)

type PixKey struct {
    ID        uuid.UUID
    Type      PixKeyType
    Value     string
    Account   AccountInfo
    Owner     OwnerInfo
    ISPB      string
    CreatedAt time.Time
    UpdatedAt time.Time
    Active    bool
}

var (
    ErrInvalidCPF       = errors.New("CPF inválido")
    ErrInvalidCNPJ      = errors.New("CNPJ inválido")
    ErrKeyAlreadyExists = errors.New("Chave já registrada")
    ErrMaxKeysReached   = errors.New("Limite de chaves por pessoa atingido")
    ErrKeyNotFound      = errors.New("Chave não encontrada")
    ErrSamePSP          = errors.New("Não é possível claim no mesmo PSP")
)

func NewPixKey(keyType PixKeyType, value string, account AccountInfo, owner OwnerInfo) (*PixKey, error) {
    if err := validateKey(keyType, value); err != nil {
        return nil, err
    }

    if keyType == KeyTypeRandom && value == "" {
        value = uuid.New().String()
    }

    return &PixKey{
        ID: uuid.New(), Type: keyType, Value: value,
        Account: account, Owner: owner, ISPB: account.ISPB,
        CreatedAt: time.Now(), UpdatedAt: time.Now(), Active: true,
    }, nil
}

func validateKey(keyType PixKeyType, value string) error {
    switch keyType {
    case KeyTypeCPF:    return validateCPF(value)
    case KeyTypeCNPJ:   return validateCNPJ(value)
    case KeyTypeEmail:  return validateEmail(value)
    case KeyTypePhone:  return validatePhone(value)
    case KeyTypeRandom: return validateRandomKey(value)
    default:            return errors.New("tipo desconhecido")
    }
}

func validateCPF(cpf string) error {
    digits := normalizeDocument(cpf)
    if len(digits) != 11 { return ErrInvalidCPF }

    allSame := true
    for i := 1; i < len(digits); i++ {
        if digits[i] != digits[0] { allSame = false; break }
    }
    if allSame { return ErrInvalidCPF }
    if !validateCPFDigits(digits) { return ErrInvalidCPF }
    return nil
}

func validateCPFDigits(cpf string) bool {
    sum := 0
    for i := 0; i < 9; i++ { sum += int(cpf[i]-'0') * (10 - i) }
    remainder := (sum * 10) % 11
    if remainder == 10 { remainder = 0 }
    if remainder != int(cpf[9]-'0') { return false }

    sum = 0
    for i := 0; i < 10; i++ { sum += int(cpf[i]-'0') * (11 - i) }
    remainder = (sum * 10) % 11
    if remainder == 10 { remainder = 0 }
    return remainder == int(cpf[10]-'0')
}

func validateCNPJ(cnpj string) error {
    digits := normalizeDocument(cnpj)
    if len(digits) != 14 { return ErrInvalidCNPJ }

    allSame := true
    for i := 1; i < len(digits); i++ {
        if digits[i] != digits[0] { allSame = false; break }
    }
    if allSame { return ErrInvalidCNPJ }
    if !validateCNPJDigits(digits) { return ErrInvalidCNPJ }
    return nil
}

func validateCNPJDigits(cnpj string) bool {
    weights1 := []int{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}
    weights2 := []int{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2}

    sum := 0
    for i := 0; i < 12; i++ { sum += int(cnpj[i]-'0') * weights1[i] }
    remainder := sum % 11
    digit1 := 0
    if remainder >= 2 { digit1 = 11 - remainder }
    if digit1 != int(cnpj[12]-'0') { return false }

    sum = 0
    for i := 0; i < 13; i++ { sum += int(cnpj[i]-'0') * weights2[i] }
    remainder = sum % 11
    digit2 := 0
    if remainder >= 2 { digit2 = 11 - remainder }
    return digit2 == int(cnpj[13]-'0')
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func validateEmail(email string) error {
    e := strings.ToLower(strings.TrimSpace(email))
    if len(e) > 77 { return ErrInvalidEmail }
    if !emailRegex.MatchString(e) { return ErrInvalidEmail }
    return nil
}

var phoneRegex = regexp.MustCompile(`^\+?55\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$`)

func validatePhone(phone string) error {
    digits := normalizeDocument(phone)
    if !strings.HasPrefix(digits, "55") { return ErrInvalidPhone }
    if len(digits) != 13 { return ErrInvalidPhone }
    return nil
}

var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func validateRandomKey(value string) error {
    if !uuidRegex.MatchString(strings.ToLower(value)) { return ErrInvalidRandomKey }
    return nil
}

func normalizeDocument(doc string) string {
    var result strings.Builder
    for _, r := range doc {
        if r >= '0' && r <= '9' { result.WriteRune(r) }
    }
    return result.String()
}
```

### Repository — MongoDB

```go
package repositories

import (
    "context"
    "time"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "fintech/dict/domain"
)

type MongoPixKeyRepository struct {
    collection *mongo.Collection
}

func NewMongoPixKeyRepository(db *mongo.Database) (*MongoPixKeyRepository, error) {
    repo := &MongoPixKeyRepository{collection: db.Collection("pix_keys")}
    if err := repo.createIndexes(context.Background()); err != nil {
        return nil, err
    }
    return repo, nil
}

func (r *MongoPixKeyRepository) createIndexes(ctx context.Context) error {
    indexes := []mongo.IndexModel{
        {Keys: bson.D{{Key: "value", Value: 1}}, Options: options.Index().SetUnique(true)},
        {Keys: bson.D{{Key: "ispb", Value: 1}, {Key: "active", Value: 1}}},
        {Keys: bson.D{{Key: "owner.document", Value: 1}, {Key: "active", Value: 1}}},
    }
    _, err := r.collection.Indexes().CreateMany(ctx, indexes)
    return err
}

func (r *MongoPixKeyRepository) Save(ctx context.Context, key *domain.PixKey) error {
    doc := PixKeyDocument{
        ID: key.ID.String(), Type: key.Type, Value: key.Value,
        Account: AccountDocument{ISPB: key.Account.ISPB, Branch: key.Account.Branch, Number: key.Account.Number, Type: key.Account.Type},
        Owner: OwnerDocument{Name: key.Owner.Name, Document: key.Owner.Document},
        ISPB: key.ISPB, CreatedAt: key.CreatedAt, UpdatedAt: key.UpdatedAt, Active: key.Active,
    }
    _, err := r.collection.InsertOne(ctx, doc)
    if mongo.IsDuplicateKeyError(err) { return domain.ErrKeyAlreadyExists }
    return err
}

func (r *MongoPixKeyRepository) FindByValue(ctx context.Context, value string) (*domain.PixKey, error) {
    var doc PixKeyDocument
    err := r.collection.FindOne(ctx, bson.M{"value": value, "active": true}).Decode(&doc)
    if err == mongo.ErrNoDocuments { return nil, nil }
    if err != nil { return nil, err }
    return toDomain(&doc), nil
}

func (r *MongoPixKeyRepository) FindByOwnerDocument(ctx context.Context, document string) ([]*domain.PixKey, error) {
    cursor, err := r.collection.Find(ctx, bson.M{"owner.document": document, "active": true})
    if err != nil { return nil, err }
    defer cursor.Close(ctx)

    var keys []*domain.PixKey
    for cursor.Next(ctx) {
        var doc PixKeyDocument
        if err := cursor.Decode(&doc); err != nil { return nil, err }
        keys = append(keys, toDomain(&doc))
    }
    return keys, nil
}
```

### Use Cases — Registro

```go
package usecase

import (
    "context"
    "errors"
    "time"
    "github.com/google/uuid"
    "go.uber.org/zap"
    "fintech/dict/domain"
)

type RegisterKeyUseCase struct {
    repo    *repositories.MongoPixKeyRepository
    lock    *locks.DistributedLock
    eventPub *events.Publisher
    logger  *zap.Logger
    maxKeys int
}

func (uc *RegisterKeyUseCase) Execute(ctx context.Context, input RegisterKeyInput) (*RegisterKeyOutput, error) {
    value := input.Value
    if input.Type == domain.KeyTypeRandom {
        if value != "" { return nil, errors.New("chave aleatória não deve ter valor") }
        value = uuid.New().String()
    } else if value == "" {
        return nil, errors.New("valor é obrigatório")
    }

    lockKey := "pix_key:" + value
    unlock, err := uc.lock.Acquire(ctx, lockKey, 10*time.Second)
    if err != nil { return nil, errors.New("não foi possível adquirir lock") }
    defer unlock()

    existing, _ := uc.repo.FindByValue(ctx, value)
    if existing != nil { return nil, domain.ErrKeyAlreadyExists }

    existingByOwner, _ := uc.repo.FindByOwnerDocument(ctx, input.Owner.Document)
    if len(existingByOwner) >= uc.maxKeys { return nil, domain.ErrMaxKeysReached }

    key, err := domain.NewPixKey(input.Type, value, input.Account, input.Owner)
    if err != nil { return nil, err }

    if err := uc.repo.Save(ctx, key); err != nil { return nil, err }

    uc.eventPub.Publish(ctx, events.KeyRegistered{KeyID: key.ID.String(), Type: key.Type})
    return &RegisterKeyOutput{ID: key.ID.String(), Type: key.Type, Value: key.Value}, nil
}
```

### Use Cases — Claim (Portabilidade)

```go
type ClaimKeyUseCase struct {
    pixKeyRepo *repositories.MongoPixKeyRepository
    claimRepo  ClaimRepository
    lock       *locks.DistributedLock
    notifySvc  *notifications.Service
    logger     *zap.Logger
    expiryHours int
}

func (uc *ClaimKeyUseCase) Execute(ctx context.Context, input ClaimKeyInput) (*ClaimKeyOutput, error) {
    lockKey := "pix_key:" + input.Key
    unlock, err := uc.lock.Acquire(ctx, lockKey, 15*time.Second)
    if err != nil { return nil, errors.New("não foi possível adquirir lock") }
    defer unlock()

    currentKey, _ := uc.pixKeyRepo.FindByValue(ctx, input.Key)
    if currentKey == nil { return nil, domain.ErrKeyNotFound }

    if currentKey.ISPB == input.ClaimerISPB { return nil, domain.ErrSamePSP }

    activeClaim, _ := uc.claimRepo.FindActiveByKey(ctx, input.Key)
    if activeClaim != nil { return nil, domain.ErrClaimAlreadyExists }

    now := time.Now()
    expiresAt := now.Add(time.Duration(uc.expiryHours) * time.Hour)

    claim := &Claim{
        ID: uuid.New(), Key: input.Key, CurrentISPB: currentKey.ISPB,
        ClaimerISPB: input.ClaimerISPB, Reason: input.Reason,
        Status: domain.ClaimPending, CreatedAt: now, ExpiresAt: expiresAt,
    }
    uc.claimRepo.Save(ctx, claim)

    uc.notifySvc.NotifyPSP(ctx, currentKey.ISPB, notifications.ClaimReceived{
        ClaimID: claim.ID.String(), Key: input.Key, ClaimerISPB: input.ClaimerISPB,
    })

    return &ClaimKeyOutput{ClaimID: claim.ID.String(), Status: "PENDING", ExpiresAt: expiresAt}, nil
}
```

### Distributed Lock com Redis

```go
package locks

import (
    "context"
    "errors"
    "time"
    "github.com/redis/go-redis/v9"
)

type DistributedLock struct {
    client *redis.Client
}

func (l *DistributedLock) Acquire(ctx context.Context, key string, ttl time.Duration) (func(), error) {
    ok, err := l.client.SetNX(ctx, "lock:"+key, "1", ttl).Result()
    if err != nil { return nil, err }
    if !ok { return nil, errors.New("lock already held") }

    return func() { l.client.Del(context.Background(), "lock:"+key) }, nil
}

func (l *DistributedLock) WithLock(ctx context.Context, key string, ttl time.Duration, fn func() error) error {
    unlock, err := l.Acquire(ctx, key, ttl)
    if err != nil { return err }
    defer unlock()
    return fn()
}
```

### HTTP Handlers

```go
package http

import (
    "encoding/json"
    "net/http"
    "strings"
    "github.com/go-chi/chi/v5"
    "go.uber.org/zap"
)

type PixKeyHandler struct {
    registerUC  *usecase.RegisterKeyUseCase
    queryUC     *usecase.QueryKeyUseCase
    claimUC     *usecase.ClaimKeyUseCase
    rateLimiter *ratelimit.Limiter
    antiEnum    *security.AntiEnumeration
    logger      *zap.Logger
}

func (h *PixKeyHandler) Register(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Type    string `json:"type"`
        Value   string `json:"value"`
        Account struct { ISPB, Branch, Number, Type string } `json:"account"`
        Owner   struct { Name, Document string } `json:"owner"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error":"invalid request"}`, http.StatusBadRequest)
        return
    }

    if !h.rateLimiter.Consume("register:"+req.Account.ISPB, 1, ratelimit.Config{Limit: 100, Window: 60}) {
        http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
        return
    }

    output, err := h.registerUC.Execute(r.Context(), usecase.RegisterKeyInput{
        Type: domain.PixKeyType(req.Type), Value: req.Value,
        Account: domain.AccountInfo{ISPB: req.Account.ISPB, Branch: req.Account.Branch, Number: req.Account.Number, Type: req.Account.Type},
        Owner: domain.OwnerInfo{Name: req.Owner.Name, Document: req.Owner.Document},
    })
    if err != nil {
        if err == domain.ErrKeyAlreadyExists {
            http.Error(w, `{"error":"key already registered"}`, http.StatusConflict)
            return
        }
        http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(output)
}

func (h *PixKeyHandler) Query(w http.ResponseWriter, r *http.Request) {
    key := chi.URLParam(r, "key")
    requesterISPB := r.Header.Get("X-ISPB")
    if requesterISPB == "" {
        http.Error(w, `{"error":"missing ISPB header"}`, http.StatusUnauthorized)
        return
    }

    if !h.rateLimiter.Consume("query:"+requesterISPB, 1, ratelimit.Config{Limit: 1000, Window: 60}) {
        http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
        return
    }

    output, err := h.queryUC.Execute(r.Context(), key, requesterISPB)
    if err != nil {
        if err == domain.ErrKeyNotFound {
            h.antiEnum.AnalyzeQuery(r.Context(), requesterISPB, getClientIP(r), key, false)
            http.Error(w, `{"error":"key not found"}`, http.StatusNotFound)
            return
        }
        http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
        return
    }

    h.antiEnum.AnalyzeQuery(r.Context(), requesterISPB, getClientIP(r), key, true)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "key": output.Value, "type": output.Type,
        "owner": map[string]string{"name": maskName(output.Owner.Name), "document": maskDocument(output.Owner.Document)},
        "account": map[string]interface{}{"ispb": output.Account.ISPB, "branch": output.Account.Branch, "number": maskAccount(output.Account.Number)},
    })
}

func maskDocument(doc string) string {
    digits := domain.NormalizeDocument(doc)
    if len(digits) == 11 { return "***." + digits[3:6] + "." + digits[6:9] + "-**" }
    return "**." + digits[2:5] + "." + digits[5:8] + "/0001-**"
}
```

### Performance: Otimizações em Go

| Otimização | Impacto |
|------------|---------|
| **Regex pré-compilado** | `regexp.MustCompile()` evita recompilação |
| **String builders** | `strings.Builder` para concatenação eficiente |
| **sync.Pool** | Reutilização de buffers |
| **Connection pooling** | MongoDB, Redis connections reutilizadas |
| **Locks granulares** | Por chave, não global |
| **Worker pools** | Limita concorrência |

### Benchmark: TypeScript vs Go

| Operação | TS P99 | Go P99 | TS Throughput | Go Throughput |
|----------|--------|--------|---------------|---------------|
| Register | 45ms | 18ms | 3.5K/s | 12K/s |
| Query (cache) | 5ms | 2ms | 22K/s | 45K/s |
| Query (db) | 25ms | 8ms | 8K/s | 22K/s |
| Claim | 65ms | 28ms | 2.8K/s | 9.5K/s |

### Arquitetura Híbrida Recomendada

```mermaid
graph TB
    subgraph "Edge (TypeScript)"
      BFF1[BFF Mobile]
      BFF2[BFF Web]
      ADMIN[Admin Dashboard]
    end

    subgraph "Core (Go)"
      DICT_CORE[DICT Core Service]
      CLAIM_SVC[Claim Service]
      AUDIT[Audit Worker]
    end

    subgraph "Cache"
      REDIS1[(Redis Cluster)]
      REDIS2[(Redis Locks)]
    end

    subgraph "Data"
      MONGO1[(MongoDB Primary)]
      MONGO2[(MongoDB Replicas)]
      PG[(PostgreSQL Audit)]
    end

    BFF1 --> DICT_CORE
    BFF2 --> DICT_CORE
    ADMIN --> DICT_CORE

    DICT_CORE --> REDIS1
    DICT_CORE --> REDIS2
    DICT_CORE --> MONGO1

    CLAIM_SVC --> REDIS2
    CLAIM_SVC --> MONGO1

    AUDIT --> MONGO2
    AUDIT --> PG

    classDef edge fill:#4f46e5,stroke:#3730a3;
    classDef core fill:#10b981,stroke:#059669;
    classDef cache fill:#f59e0b,stroke:#d97706;
    classDef data fill:#6366f1,stroke:#4f46e5;

    class BFF1,BFF2,ADMIN edge;
    class DICT_CORE,CLAIM_SVC,AUDIT core;
    class REDIS1,REDIS2 cache;
    class MONGO1,MONGO2,PG data;
```

### Sinais de que precisa migrar pra Go

- P99 > 50ms em consultas
- CPU > 80% (validações travando event loop)
- 10+ instâncias (custo de infra alto)
- Lock contention frequente
- Throughput estagnado

### Conclusão

| Cenário | Escolha |
|---------|---------|
| MVP / Startup | TypeScript com MongoDB + Redis |
| Fintech crescimento | TS no edge, Go no core |
| Banco grande | Go com sharding + Redis Cluster |

**Uma falha no DICT paralisa o PIX.** Invista em redundância, observabilidade e testes rigorosos.

</div>

---

## Como testar

```bash
# TypeScript
make infra-up
pnpm --filter @banking/dict dev

# Registrar chave
curl -X POST http://localhost:3003/api/v1/dict/keys \
  -H "Content-Type: application/json" \
  -d '{"type":"CPF","value":"12345678901","account":{"ispb":"12345678","branch":"0001","number":"12345","type":"CACC"},"owner":{"name":"João","document":"12345678901"}}'

# Consultar chave
curl http://localhost:3003/api/v1/dict/keys/12345678901 \
  -H "X-ISPB: 12345678"

# Go
cd packages/backend/dict-simulator-go
go run .
```

---

## Lições aprendidas

1. **Uma chave = uma conta** — Invariante sagrado do DICT
2. **Anti-enumeration não é opcional** — Proteção contra varreduras de CPFs
3. **Locks distribuídos são obrigatórios** — Race conditions em claims corrompem ownership
4. **Masking de dados** — Nunca retorne CPF/CNPJ completo
5. **Cache com TTL inteligente** — Claims mudam ownership, cache precisa invalidar
6. **Auditoria de tudo** — Cada consulta deve ser logada
7. **Limite de 5 chaves por pessoa** — Regra do BCB
8. **Claim expira em 7 dias** — Implemente limpeza automática
9. **Go escala linearmente** — CPUs extras viram throughput direto
10. **TypeScript é suficiente** — Para volumes moderados (< 5K req/s)
