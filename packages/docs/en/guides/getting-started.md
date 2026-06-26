# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker
- Go 1.23+ (optional, for Go services)

## Quick start

```bash
# Clone the repo
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d

# Start all services
pnpm dev
```

## Services

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| SPI Simulator | 3002 | `/spi/health` |
| DICT Simulator | 3003 | `/dict/health` |
| ISO 8583 | 3004 | `/health` |
| Workflow Engine | 3005 | `/health` |
| Open Finance | 3006 | `/health` |
| NFS-e | 3007 | `/health` |
| Report System | 3008 | `/health` |
| Leaky Bucket | 3009 | `/health` |
| Ledger | 3010 | `/graphql` |
| Landing Page | 3000 | - |
| KYC System | 5173 | - |

## Running a single service

```bash
# SPI Simulator
cd packages/backend/spi-simulator-go
go run .

# Or TypeScript version
cd packages/backend/spi-simulator
pnpm dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific service tests
cd packages/backend/spi-simulator
pnpm test
```
