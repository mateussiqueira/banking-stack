---
layout: page
title: Architecture
---

# Architecture

Technical architecture decisions, patterns, and system design for the Banking Challenges project.

## Overview

- [Architecture Overview](/en/architecture/overview) — System design and component interaction
- [Decision Log (ADR)](/en/architecture/decision-log) — 5 Architecture Decision Records

## Key Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Monorepo with Turborepo | ✅ Accepted |
| ADR-002 | GraphQL + Relay for Ledger | ✅ Accepted |
| ADR-003 | ISO 20022 for SPI | ✅ Accepted |
| ADR-004 | MongoDB for Financial Data | ✅ Accepted |
| ADR-005 | Go for SPI and DICT | ✅ Accepted |

## Challenge Mapping

| # | Challenge | Stack | Database |
|---|-----------|-------|----------|
| 01 | [Ledger GraphQL](/en/challenges/01-ledger) | Koa + GraphQL | MongoDB |
| 02 | [SPI Simulator](/en/challenges/02-spi) | Go (Gin) + ISO 20022 | In-memory |
| 03 | [DICT Simulator](/en/challenges/03-dict) | Go (Gin) + REST | In-memory |
| 04 | [ISO 8583](/en/challenges/04-iso8583) | TCP Server + Go | PostgreSQL |
| 05 | [Workflow Engine](/en/challenges/05-workflow) | Fastify + DAG | Redis |
| 06 | [Open Finance](/en/challenges/06-open-finance) | Fastify + FAPI | PostgreSQL |
| 07 | [NFS-e](/en/challenges/07-nfse) | Fastify + SOAP | PostgreSQL |
| 08 | [Report System](/en/challenges/08-report) | Fastify + Streaming | PostgreSQL |
| 09 | [Leaky Bucket](/en/challenges/09-leaky-bucket) | Fastify + Lua | Redis |
| 10 | [Landing Page](/en/challenges/10-landing-page) | Next.js 14 | - |
| 11 | [KYC System](/en/challenges/11-kyc) | Vite + React | PostgreSQL |
| 12 | [Proxmox + IaC](/en/challenges/12-proxmox) | Terraform + Ansible | - |
| 13 | [CI/CD](/en/challenges/13-cicd) | GitHub Actions | - |
| 14 | [RFC / ADR](/en/challenges/14-rfc) | Markdown | - |
| 15 | [PISP](/en/challenges/15-pisp) | Open Finance + FAPI | PostgreSQL |
| 16 | [Anticipation](/en/challenges/16-anticipation) | Pricing Engine | PostgreSQL |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | TypeScript (Fastify, Koa) + Go (Gin) |
| Database | MongoDB 7, PostgreSQL 16, Redis 7 |
| Frontend | Next.js 14, Vite + React |
| Storage | MinIO (S3-compatible) |
| Docs | VitePress |
| Infra | Docker Compose, Turborepo, Vercel |
| CI/CD | GitHub Actions / GitLab CI |
| IaC | Terraform, Ansible, Proxmox |

## Security

| Layer | Technology |
|-------|------------|
| Transport | TLS 1.3, mTLS |
| Auth | JWT, OAuth 2.0, FAPI |
| Crypto | AES-256, RSA, 3DES |
| Rate Limiting | Leaky Bucket (Redis + Lua) |
| Audit | Immutable logs, 5+ years |
