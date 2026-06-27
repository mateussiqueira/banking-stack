---
layout: page
title: Arquitetura
---

# Arquitetura / Architecture

Decisões de arquitetura, padrões e design do sistema Banking Challenges.

## Visão Geral

- [Overview da Arquitetura](/architecture/overview) — Design do sistema e interação entre componentes
- [Decision Log (ADR)](/architecture/decision-log) — 5 Architecture Decision Records

## Decisões Principais

| ADR | Decisão | Status |
|-----|---------|--------|
| ADR-001 | Monorepo com Turborepo | Aceito |
| ADR-002 | GraphQL + Relay para Ledger | Aceito |
| ADR-003 | ISO 20022 para SPI | Aceito |
| ADR-004 | MongoDB para Dados Financeiros | Aceito |
| ADR-005 | Design System Componentizado | Aceito |

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | TypeScript (Fastify, Koa) + Go (Gin) |
| Database | MongoDB 7, PostgreSQL 16, Redis 7 |
| Frontend | Next.js 14, Vite + React |
| Storage | MinIO (S3-compatible) |
| Docs | VitePress |
| Infra | Docker Compose, Turborepo, Vercel |
