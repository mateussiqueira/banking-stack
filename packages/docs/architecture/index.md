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
| ADR-001 | Monorepo com Turborepo | ✅ Aceito |
| ADR-002 | GraphQL + Relay para Ledger | ✅ Aceito |
| ADR-003 | ISO 20022 para SPI | ✅ Aceito |
| ADR-004 | MongoDB para Dados Financeiros | ✅ Aceito |
| ADR-005 | Go para SPI e DICT | ✅ Aceito |

## Mapeamento de Desafios

| # | Desafio | Stack | Database |
|---|---------|-------|----------|
| 01 | [Ledger GraphQL](/challenges/01-ledger) | Koa + GraphQL | MongoDB |
| 02 | [SPI Simulator](/challenges/02-spi) | Go (Gin) + ISO 20022 | In-memory |
| 03 | [DICT Simulator](/challenges/03-dict) | Go (Gin) + REST | In-memory |
| 04 | [ISO 8583](/challenges/04-iso8583) | TCP Server + Go | PostgreSQL |
| 05 | [Workflow Engine](/challenges/05-workflow) | Fastify + DAG | Redis |
| 06 | [Open Finance](/challenges/06-open-finance) | Fastify + FAPI | PostgreSQL |
| 07 | [NFS-e](/challenges/07-nfse) | Fastify + SOAP | PostgreSQL |
| 08 | [Report System](/challenges/08-report) | Fastify + Streaming | PostgreSQL |
| 09 | [Leaky Bucket](/challenges/09-leaky-bucket) | Fastify + Lua | Redis |
| 10 | [Landing Page](/challenges/10-landing-page) | Next.js 14 | - |
| 11 | [KYC System](/challenges/11-kyc) | Vite + React | PostgreSQL |
| 12 | [Proxmox + IaC](/challenges/12-proxmox) | Terraform + Ansible | - |
| 13 | [CI/CD](/challenges/13-cicd) | GitHub Actions | - |
| 14 | [RFC / ADR](/challenges/14-rfc) | Markdown | - |
| 15 | [PISP](/challenges/15-pisp) | Open Finance + FAPI | PostgreSQL |
| 16 | [Antecipação](/challenges/16-anticipation) | Pricing Engine | PostgreSQL |

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | TypeScript (Fastify, Koa) + Go (Gin) |
| Database | MongoDB 7, PostgreSQL 16, Redis 7 |
| Frontend | Next.js 14, Vite + React |
| Storage | MinIO (S3-compatible) |
| Docs | VitePress |
| Infra | Docker Compose, Turborepo, Vercel |
| CI/CD | GitHub Actions / GitLab CI |
| IaC | Terraform, Ansible, Proxmox |

## Segurança

| Camada | Tecnologia |
|--------|------------|
| Transporte | TLS 1.3, mTLS |
| Autenticação | JWT, OAuth 2.0, FAPI |
| Criptografia | AES-256, RSA, 3DES |
| Rate Limiting | Leaky Bucket (Redis + Lua) |
| Audit | Logs imutáveis, 5+ anos |
