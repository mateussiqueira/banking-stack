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
| ADR-001 | Monorepo with Turborepo | Accepted |
| ADR-002 | GraphQL + Relay for Ledger | Accepted |
| ADR-003 | ISO 20022 for SPI | Accepted |
| ADR-004 | MongoDB for Financial Data | Accepted |
| ADR-005 | Componentized Design System | Accepted |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | TypeScript (Fastify, Koa, Express) + Go (Gin) |
| Database | MongoDB 7, PostgreSQL 16, Redis 7 |
| Frontend | Next.js 14, Vite + React |
| Storage | MinIO (S3-compatible) |
| Docs | VitePress |
| Infra | Docker Compose, Turborepo, Vercel |
