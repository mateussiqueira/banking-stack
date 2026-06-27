# Guia de Contribuição / Contribution Guide

## 🇧🇷 Como Contribuir

Obrigado pelo interesse em contribuir com o Banking Challenges!

### Estrutura

- **Backend**: Cada desafio é um pacote em `packages/backend/`
- **Frontend**: Pacotes em `packages/frontend/`
- **Documentação**: VitePress em `packages/docs/`
- **Infraestrutura**: Docker Compose na raiz

### Padrões

- **TypeScript**: Todo código novo deve ser TypeScript.
- **Testes**: Todo código novo deve ter testes.
- **Documentação**: Documente em PT-BR e EN.
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.).

## 🇬🇧 How to Contribute

Thank you for your interest in contributing to Banking Challenges!

### Structure

- **Backend**: Each challenge is a package in `packages/backend/`
- **Frontend**: Packages in `packages/frontend/`
- **Documentation**: VitePress in `packages/docs/`
- **Infrastructure**: Docker Compose at root

### Standards

- **TypeScript**: All new code must be TypeScript.
- **Tests**: All new code must have tests.
- **Documentation**: Document in both PT-BR and EN.
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.).

---

## Development Workflow / Fluxo de Desenvolvimento

### 1. Create a branch

```bash
git checkout -b feat/my-new-challenge
```

### 2. Add a new challenge

```bash
mkdir -p packages/backend/my-challenge/src
cd packages/backend/my-challenge
pnpm init
# Update package.json name to @banking/my-challenge
```

Add to `pnpm-workspace.yaml` and `tsconfig.json` paths.

### 3. Implement

- Follow existing code patterns
- Create tests in `src/__tests__/`
- Document in `packages/docs/challenges/`

### 4. Test

```bash
pnpm --filter @banking/my-challenge test
pnpm lint
pnpm typecheck
```

### 5. Commit

```bash
git add .
git commit -m "feat: add my-challenge with REST API"
```

### 6. Open a PR

- Describe the challenge
- Link to documentation
- Add screenshots if applicable

---

## Documentation Guidelines / Diretrizes de Documentação

- Every challenge needs a markdown file in `packages/docs/challenges/`
- Files should be named `NN-name.md` (e.g., `01-ledger.md`)
- Include PT and EN sections
- Use ASCII diagrams for architecture
- Include code examples
- Document API endpoints
- Explain technical decisions

### Documentation Template

```markdown
# NN — Challenge Name

**🇧🇷** Nome em Português
**🇬🇧** Name in English

## 🇧🇷 Descrição do Desafio

...
## 🇬🇧 Challenge Description

...
## Tech Stack

...
## Architecture / Arquitetura

...
```
