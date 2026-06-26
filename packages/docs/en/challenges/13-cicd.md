# Challenge 13 — CI/CD

**What is it:** Continuous integration and deployment pipelines for the banking stack.

**Why it matters:** Financial systems need rigorous testing and controlled deployments.

## The pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Push    │───▶│  Lint    │───▶│  Test    │───▶│  Build   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
                                                ┌──────────┐
                                                │  Deploy  │
                                                └──────────┘
```

## GitHub Actions

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
```

## Branch strategy

- **main** — production
- **develop** — integration
- **feature/\*** — new features
- **hotfix/\*** — urgent fixes

## What we learned

1. **Tests must pass before merge** — no exceptions
2. **Build must be reproducible** — same code, same result
3. **Deploys must be rollback-able** — always have a plan B
4. **Secrets must be secure** — never in code
