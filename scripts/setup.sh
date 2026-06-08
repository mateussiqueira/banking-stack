#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================"
echo "  Banking Challenges — Setup"
echo "========================================"
echo ""

# ─── Check Node.js version ──────────────────────────────────────────────
echo "→ Checking Node.js version..."

if ! command -v node &> /dev/null; then
  echo "✖ Node.js is not installed. Please install Node.js >= 20."
  echo "  Recommended: use nvm (https://github.com/nvm-sh/nvm)"
  echo "  $ nvm install 20"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "✖ Node.js version $(node -v) is too old. Required: >= 20."
  echo "  $ nvm install 20"
  exit 1
fi

echo "✓ Node.js $(node -v)"

# ─── Check/install pnpm ─────────────────────────────────────────────────
echo "→ Checking pnpm..."

if ! command -v pnpm &> /dev/null; then
  echo "  pnpm not found. Installing globally..."
  npm install -g pnpm
  echo "✓ pnpm installed: $(pnpm -v)"
else
  echo "✓ pnpm $(pnpm -v)"
fi

# ─── Install dependencies ───────────────────────────────────────────────
echo "→ Installing dependencies..."
pnpm install
echo "✓ Dependencies installed"

# ─── Create .env from example ───────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✓ Created .env from .env.example"
    echo "  ⚠  Edit .env with your secrets before running in production"
  else
    echo "⚠  .env.example not found, skipping .env creation"
  fi
else
  echo "○ .env already exists, skipping"
fi

# ─── Create data directories ────────────────────────────────────────────
echo "→ Ensuring data directories..."
mkdir -p services/mongodb
echo "✓ Data directories ready"

# ─── Done ───────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Setup complete!"
echo ""
echo "  Quick start:"
echo "    make infra-up    Start DBs, Redis, MinIO"
echo "    make dev         Start full dev environment"
echo "    make build       Build all packages"
echo "    make test        Run all tests"
echo "========================================"
