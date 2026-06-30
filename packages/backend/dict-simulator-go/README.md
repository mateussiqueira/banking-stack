# 📋 DICT Simulator — Go

Simulador do DICT (Diretório de Identificadores de Contas Transacionais) do Banco Central do Brasil, implementado em Go.

Este projeto é uma re-implementação do [DICT Simulator original em Node.js](../dict-simulator/) utilizando Go para alta performance.

## 🎯 Objetivo

Simular o diretório central que mapeia chaves Pix para contas bancárias:
- **Registro** de chaves Pix (CPF, CNPJ, Email, Telefone, Aleatória)
- **Consulta** de chaves (resolução de chaves Pix)
- **Portabilidade** de contas (Claims)
- **Desativação** de chaves

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DICT Simulator Go                         │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │  HTTP Layer │───▶│   Service    │───▶│  In-Memory Store│ │
│  │  (chi/mux)  │    │  (Business)  │    │  (sync.RWMutex) │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │   Handlers  │    │  Validation  │    │   PixKey +      │ │
│  │  (REST API) │    │  (CPF/CNPJ)  │    │   AccountClaim  │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura

```
dict-simulator-go/
├── cmd/dict/
│   └── main.go                    # Entry point
├── internal/
│   ├── handlers/
│   │   ├── dict_handler.go        # HTTP handlers
│   │   └── dict_test.go           # Handler tests
│   ├── models/
│   │   ├── pixkey.go              # PixKey model
│   │   ├── claim.go               # AccountClaim model
│   │   └── store.go               # In-memory store
│   ├── service/
│   │   └── dict_service.go        # Business logic
│   └── validation/
│       └── validation.go          # CPF/CNPJ/Email/Phone validation
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
cd packages/backend/dict-simulator-go

# Instalar dependências
make deps

# Rodar o servidor
make run
```

O servidor inicia em `http://localhost:3003`

### Docker

```bash
# Build
make docker

# Run
make docker-run
```

## 📡 API Endpoints

### Entries (Chaves Pix)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/dict/entries` | Registrar nova chave Pix |
| `GET` | `/dict/entries` | Listar chaves (paginado) |
| `GET` | `/dict/entries/{key}` | Consultar chave Pix |
| `PATCH` | `/dict/entries/{key}` | Atualizar dados da chave |
| `DELETE` | `/dict/entries/{key}` | Desativar chave |

### Claims (Portabilidade)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/dict/claims` | Criar solicitação de portabilidade |
| `GET` | `/dict/claims/{id}` | Consultar claim |
| `POST` | `/dict/claims/{id}/confirm` | Confirmar claim |
| `POST` | `/dict/claims/{id}/cancel` | Cancelar claim |

### Health

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/dict/health` | Health check |

## 🧪 Testes

```bash
# Rodar todos os testes
make test

# Com coverage
make test-cover
```

## 📋 Tipos de Chave

| Tipo | Validação | Exemplo |
|------|-----------|---------|
| `CPF` | 11 dígitos + dígitos verificadores | `12345678909` |
| `CNPJ` | 14 dígitos + dígitos verificadores | `12345678000195` |
| `EMAIL` | Formato válido | `joao@email.com` |
| `PHONE` | 10-13 dígitos | `5511999999999` |
| `RANDOM` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |

## 🔄 Fluxo de Portabilidade (Claim)

```
1. PSP B cria claim (OPEN) → Aguardando resposta do PSP A
2. PSP A confirma (COMPLETED) → Chave transferida
3. Ou PSP A cancela (CANCELLED) → Chave permanece no PSP A
```

## 🔧 Validações

- **CPF/CNPJ**: Dígitos verificadores
- **Email**: Formato RFC 5322
- **Telefone**: Formato internacional
- **ISPB**: 8 dígitos numéricos
- **Chave duplicada**: Rejeita registro duplicado
- **Claim duplicada**: Rejeita claim aberta existente

## 📚 Referências

- [Banco Central - DICT](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Documentação API PIX](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html)

## 📄 Licença

MIT License
