# 🏦 SPI Simulator — Go

Simulador do SPI (Sistema de Pagamentos Instantâneos) do Banco Central do Brasil, implementado em Go.

Este projeto é uma re implementação do [SPI Simulator original em Node.js](../spi-simulator/) utilizando Go para alta performance e concorrência.

## 🎯 Objetivo

Simular o fluxo de liquidação do Banco Central utilizando mensagens ISO 20022 (XML):
- **pacs.008** — Credit Transfer (Transferência entre bancos)
- **pacs.002** — Status Report (Confirmação de status)
- **pacs.004** — Payment Return (Devolução de pagamento)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    SPI Simulator Go                          │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │  HTTP Layer │───▶│   Service    │───▶│  In-Memory Store│ │
│  │  (chi/mux)  │    │  (Business)  │    │  (sync.RWMutex) │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │   Handlers  │    │  ISO 20022   │    │  Transaction    │ │
│  │  (REST API) │    │  Parser/Builder│   │    Models       │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura

```
spi-simulator-go/
├── cmd/spi/
│   └── main.go                    # Entry point
├── internal/
│   ├── handlers/
│   │   ├── spi_handler.go         # HTTP handlers
│   │   └── spi_test.go            # Handler tests
│   ├── iso20022/
│   │   ├── schemas.go             # XML structs (ISO 20022)
│   │   ├── parser.go              # XML parsing
│   │   └── messages.go            # XML building
│   ├── models/
│   │   ├── transaction.go         # Transaction model
│   │   └── store.go               # In-memory store (thread-safe)
│   └── service/
│       └── spi_service.go         # Business logic
├── samples/                       # XML samples
├── Dockerfile
├── Makefile
├── go.mod
└── README.md
```

## 🚀 Quick Start

### Requisitos
- Go 1.22+
- Docker (opcional)

### Instalação

```bash
# Clonar e entrar no diretório
cd packages/backend/spi-simulator-go

# Instalar dependências
make deps

# Rodar o servidor
make run
```

O servidor inicia em `http://localhost:3002`

### Docker

```bash
# Build
make docker

# Run
make docker-run
```

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/spi/pacs.008` | Enviar transferência (Credit Transfer) |
| `POST` | `/spi/pacs.002` | Receber status report |
| `POST` | `/spi/pacs.004` | Receber devolução |
| `GET` | `/spi/transactions` | Listar todas as transações |
| `GET` | `/spi/transactions/{endToEndId}` | Buscar transação por ID |
| `GET` | `/spi/health` | Health check |

## 🧪 Testes

```bash
# Rodar todos os testes
make test

# Com coverage
make test-cover
```

## 📋 Fluxo de Transação

```
1. Banco A envia pacs.008 → SPI Aceita (ACCEPTED)
2. SPI processa e liquida → SPI Envia pacs.002 (SETTLED)
3. Se necessário, Banco B devolve → SPI Envia pacs.004 (RETURNED)
```

### Status Possíveis

| Status | Descrição |
|--------|-----------|
| `ACCEPTED` | Transação aceita pelo SPI |
| `REJECTED` | Transação rejeitada |
| `SETTLED` | Transação liquidada |
| `RETURNED` | Transação devolvida |

## 🔧 Validações

- **ISPB válido**: Valida se o código ISPB do banco existe
- **Valor**: Deve ser > 0 e <= R$ 100.000.000
- **Duplicidade**: EndToEndId deve ser único
- **Status**: Transações só podem evoluir no fluxo correto

## 📚 Referências

- [ISO 20022 - pacs.008](https://www.iso.org/standard/78496.html)
- [Banco Central - SPI](https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentospix)
- [Documentação API PIX](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html)

## 📄 Licença

MIT License
