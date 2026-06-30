# Desafio 13: CI/CD — O Pulmão que Respira Código em Produção

**🇧🇷** Pipeline de Deploy Automatizado com Compliance BACEN
**🇬🇧** Automated Deployment Pipeline with BACEN Compliance

---

## 🎯 Objetivos de Aprendizado

- Construir um pipeline CI/CD compatível com a Resolução BACEN 4.893/2021
- Dominar estratégias de deploy zero-downtime: Blue/Green, Canary e Rolling
- Configurar SAST/DAST/dependency scanning como barreira obrigatória em cada PR
- Implementar composite actions reutilizáveis para monorepo com pnpm + turborepo
- Medir performance de entrega com métricas DORA e criar dashboards de observabilidade

---

## 📋 Pré-requisitos

### 🧠 Conceitos
- CI/CD pipelines
- GitOps (push vs pull)
- Docker multi-stage builds
- Semantic versioning (semver)
- Blue-green e canary deployment
- Compliance gates (SAST, DAST, dependency scanning)

### 📚 Desafios Anteriores
- Nenhum específico — infraestrutura compartilhada que serve a todos os desafios do banking-stack

### 🛠️ Ferramentas
- Docker
- GitHub Actions
- Kubernetes (kubectl)
- Harbor ou GHCR (container registry)
- Trivy (scanner de segurança)
- SonarQube
- Codecov

### 💻 Técnico
- YAML
- Shell scripting
- Docker (Dockerfile, multi-stage)
- Kubernetes manifests
- Monorepo (turborepo/pnpm workspaces)
- Release management

---

## 📖 Abertura — Por que Deploy Manual é uma Bomba-Relógio

"Vou te explicar. deixa eu te contar uma história que todo dev deveria conhecer. Era 1º de agosto de 2012, uma quarta-feira ensolarada em Jersey City. A Knight Capital, uma das maiores trading firms de Wall Street — responsável por 10% de todas as ordens da NYSE — resolveu fazer um deploy. Nada demais. Era só uma atualização do sistema de roteamento de ordens, o SMARS. O deploy foi feito à noite, fora do horário de pico, seguindo o procedimento manual que eles usavam há anos: um técnico copiava os arquivos novos para cada um dos 8 servidores, um por um. Só que naquela noite, um servidor não recebeu os arquivos. Ninguém percebeu.

Às 9h30 da manhã seguinte, o mercado abriu. O sistema novo começou a processar ordens — só que ele tinha um flag de 'test mode' ativado que replicava ordens infinitamente. O servidor velho também estava rodando, processando as mesmas ordens. Os dois sistemas começaram a competir, comprando e vendendo as mesmas ações em loop. Em 45 minutos, a Knight Capital executou transações erradas que somaram US$ 6.6 bilhões. O prejuízo líquido foi de **US$ 460 milhões**. A empresa, que valia US$ 1.5 bilhão, foi vendida por US$ 400 milhões pra não falir. Dois anos depois, não existia mais.

Tudo isso porque um servidor não recebeu um arquivo durante um deploy manual. Um arquivo.

Agora, deixa eu te levar mais longe no tempo. Volta pra 1995. A internet comercial está nascendo. Deploy de software era literalmente FTP. Você desenvolvia no Windows 95 ou no Solaris, buildava localmente, conectava via FTP no servidor de produção e fazia upload dos arquivos. Se desse erro? Você fazia upload de novo. Se quebrasse o site? Ficava quebrado até alguém perceber e consertar manualmente. Não existia rollback. Não existia teste automatizado. Não existia 'ambiente de staging'. Existia 'funcionou na minha máquina' e 'deus queira que funcione no servidor'.

Aí vieram os anos 2000. O boom do e-commerce e dos portais. Os deploys começaram a ser 'agendados'. Lembra daquele aviso 'nosso site estará em manutenção das 2h às 6h da manhã'? Era isso. O time de infra parava o servidor, subia a versão nova via shell script, reiniciava o Tomcat, e rezava. Se desse errado, o site ficava fora do ar por horas enquanto alguém tentava fazer rollback manual — que geralmente significava pegar o backup da versão anterior (se existisse) e fazer o processo inverso, rezando de novo.

Entra Martin Fowler. Em 2006, Fowler publicou um artigo chamado 'Continuous Integration' no site da ThoughtWorks. A ideia era revolucionária: 'todo commit deve ser integrado e testado automaticamente'. Na mesma época, Kent Beck lançava o Extreme Programming e pregava 'integração contínua' como prática central. O CruiseControl — um dos primeiros servidores de CI — foi criado pela ThoughtWorks em 2001. Ele monitorava repositórios CVS e rodava builds automaticamente. Era lento, era frágil, mas era o começo.

Depois veio o Hudson, que virou Jenkins. Depois o Travis CI, que popularizou CI como serviço. Depois veio o GitHub Actions em 2019 — e aí CI/CD deixou de ser 'coisa de empresa grande com time de DevOps dedicado' e virou 'coisa que qualquer dev configura em 15 minutos com um arquivo YAML'.

Mas o ponto não é a ferramenta. O ponto é a **mudança de mentalidade**. Durante 40 anos — dos anos 70 aos anos 2010 — deploy foi um **evento**. Você agendava. Você preparava. Você tinha medo. O time de infra era uma casta separada que detinha as chaves do castelo. Dev escrevia código, 'jogava por cima do muro', e infra que se virasse pra colocar no ar. Essa separação criava um ciclo vicioso: dev não entendia produção → infra não entendia o código → deploy quebrava → mais burocracia pra deploy → dev mais distante de produção.

Em 2009, John Allspaw e Paul Hammond fizeram uma palestra na Velocity Conference chamada '10+ Deploys per Day: Dev and Ops Cooperation at Flickr'. Eles mostraram que o Flickr fazia **10 deploys por dia** sem downtime. A plateia ficou em choque. Naquela época, deploy era um ritual mensal ou trimestral. A ideia de deployar 10 vezes por dia parecia suicídio. Mas a lógica deles era impecável: **quanto mais você deploya, menor o risco de cada deploy**. Se cada deploy mexe em 3 linhas de código, o blast radius é mínimo. Se você deploya uma vez por mês, cada deploy mexe em 5000 linhas — e a chance de algo quebrar é astronômica.

Essa palestra deu origem ao movimento DevOps. E o DevOps não é 'CI/CD pipeline' — é a ideia de que **quem escreve o código também é responsável por como ele roda em produção**. É o fim do 'muro'. É você, dev, acordando às 3h da manhã porque seu deploy quebrou e você sabe exatamente como consertar porque você que fez o pipeline.

Agora, traz isso pro Brasil. Em 2021, o Banco Central publicou a **Resolução Conjunta nº 4.893**. Ela diz, em português claro: 'toda alteração em sistema crítico deve ser documentada, testada, aprovada e reversível'. Não é sugestão. É lei. Se você é uma fintech autorizada pelo BACEN, cada deploy precisa ter:

1. **Hash do commit** — exatamente qual versão foi deployada
2. **Quem aprovou** — e tem que ser alguém que não escreveu o código
3. **Evidência de teste** — unitário, integração, segurança
4. **Timestamp** — quando entrou em produção
5. **Plano de rollback** — como voltar atrás em menos de 1 hora

Isso não é burocracia. É **engenharia de confiança**. O BACEN está dizendo: 'você mexe no dinheiro de milhões de brasileiros. Você vai provar que sabe o que está fazendo.' E sabe qual é a beleza? Um pipeline CI/CD bem feito **já entrega todas essas evidências automaticamente**. Cada job do GitHub Actions é um registro auditável. Cada approval no GitHub Environments é uma assinatura digital. Cada hash de commit é rastreável até a tag de deploy.

O Nubank faz **1000+ deploys por dia**. Cada deploy mexe em poucas linhas. Cada deploy passa por testes automatizados, SAST scan, integration tests, e só vai pra produção depois de aprovação. O MTTR (Mean Time To Recover) deles é **15 minutos**. Se algo quebra, em 15 minutos está revertido. Isso não é sorte — é engenharia. É o pipeline que respira.

E sabe qual o paradoxo? Quanto mais deploys você faz, **mais seguro** você fica. Porque deploy frequente = cada deploy é pequeno = risco baixo = se quebrar, rollback rápido. Deploy raro = cada deploy é monstro = risco altíssimo = se quebrar, ninguém sabe o que foi = pânico.

Então bora construir esse pulmão. Porque em fintech, deploy não é evento — é rotina. E rotina boa é rotina automatizada."

---

## 🔥 O Problema

Imagine seu time mantendo uma monorepo com 15 serviços: Ledger, DICT, ISO 8583, Auth, Notifications, Webhooks, Billing, Dashboard, Admin, API Gateway, Event Bus, Scheduler, Reports, Compliance Engine e Reconciliation. Cada um em Node.js ou Go. Cada um com dependências próprias, databases próprios, contratos de API próprios. Cinco ambientes: dev, test, staging, shadow (produção espelhada), e production.

Hoje o deploi é manual:

```
1. Dev faz merge no PR
2. Dev SSH no servidor
3. git pull && npm ci && npm run build && pm2 restart ledger
4. Torcer pra funcionar
5. Se não funcionar: panic
```

Agora, escala isso. Cinco squads. Três deploys por semana cada. Ambientes diferentes com configurações diferentes. O que acontece?

### O Desastre Silencioso das Configurações Erradas

Em março de 2024, um dev senior do seu time — vamos chamar ele de Carlos — fez deploy do serviço de billing às 18h de uma sexta-feira. Era um hotfix simples: corrigir um cálculo de IOF em TED. Ele fez o merge, entrou no servidor de staging, testou por 2 minutos, 'funcionou'. Então foi pro servidor de produção, fez `docker pull` da imagem, `docker run`, e...

O serviço não subiu. Log: `Error: Cannot connect to database at mongodb://localhost:27017`. O Carlos olhou o `.env` de produção. Era `MONGODB_URI=mongodb+srv://prod-cluster.mongodb.net`. Por que o serviço estava tentando conectar no localhost?

Porque na pressa, o Carlos esqueceu de copiar o `.env.production` pro servidor. O container estava usando `.env.example` que veio no build. O serviço de billing ficou fora do ar por 47 minutos — exatamente o tempo que levou pro Carlos perceber o erro, achar o arquivo certo, recriar o container e validar. Nesse período, 340 cobranças não foram processadas. R$ 87.000 em receita atrasada. Três clientes reclamaram no Reclame Aqui. O NPS caiu 2 pontos.

Tudo isso porque uma variável de ambiente estava errada. **Um problema que qualquer pipeline CI/CD teria pego em 2 segundos** — seja via validação de config, seja via deploy automatizado que injeta secrets do Vault, seja via smoke test que verifica conexão com banco.

### O Monstro do Monorepo

Agora, imagina que seu monorepo tem 15 serviços. Cada PR modifica entre 1 e 5 serviços. Hoje você builda **todos os 15 serviços** em cada PR. O CI demora 47 minutos. Os devs começam a pular o CI — 'ah, só mexi no README' ou 'só mexi no scheduler, o resto não precisa testar'. Eles fazem push direto na main. E um dia, uma mudança no `shared/types` quebra o Ledger — mas ninguém testou o Ledger porque 'não mexeu nele'.

Esse é o problema clássico do monorepo sem **build pipeline inteligente**. O turborepo resolve isso com `dependsOn` e cache distribuído. Mas você precisa configurar. Você precisa pensar em DAG de dependências, em scopes de build, em `--filter` pra rodar só o que mudou. Sem isso, seu monorepo vira um elefante branco que ninguém quer mexer.

### O Compliance que Não Dorme

Em janeiro de 2025, o BACEN faz uma auditoria surpresa na sua fintech. O auditor pede: "Me mostre o registro de todas as alterações no sistema de ledger nos últimos 12 meses. Para cada alteração: quem fez, quem aprovou, quais testes foram executados, e evidência de rollback testado."

Sem CI/CD, a resposta do seu CTO seria: "Hmm... deixa eu ver... tem alguns logs no servidor... os PRs têm o histórico do GitHub... mas os testes? A gente rodava local, não guardava os resultados..."

Essa resposta custa, no mínimo, uma **notificação de irregularidade** do BACEN. No pior caso, **suspensão da autorização de funcionamento**. Em 2023, uma fintech brasileira recebeu uma multa de R$ 2.5 milhões porque não conseguiu provar que seus deploys tinham sido testados adequadamente.

Com CI/CD? Cada job do GitHub Actions é um registro imutável. Cada workflow run tem ID, timestamp, commit hash, logs completos, status de cada step. Você exporta os logs do GitHub Actions e entrega pro auditor. Pronto. Compliance atendido.

### O Segredo Vazado Esperando pra Acontecer

Um dev novo — vamos chamar ele de João — está configurando o serviço de notificações. Ele precisa da API key do SendGrid. Ele olha o `.env.example` e vê que precisa de `SENDGRID_API_KEY=`. Ele vai no SendGrid, pega a key, e cola no código:

```typescript
const SENDGRID_API_KEY = 'SG.abc123def456';
```

Faz commit. Push. PR aprovado. Merge. Deploy em produção.

Dois dias depois, um scraper que monitora commits públicos do GitHub encontra a chave. Ele usa a chave pra enviar 5 milhões de emails de phishing usando o domínio da sua fintech. SendGrid detecta o abuso e suspende a conta. Suas notificações transacionais — confirmação de PIX, alerta de saldo, token 2FA — param de funcionar. Clientes não recebem confirmação de transferência. O suporte explode.

Custo: reputação, multa LGPD (vazamento de chave não é vazamento de dados, mas a ANPD ainda investiga), e uma conta SendGrid queimada.

**TruffleHog teria pego isso.** Um simples `trufflehog git https://github.com/seu/repo` no pipeline CI — coisa de 3 segundos de execução — teria barrado o PR antes do merge. O João teria aprendido sobre secrets management sem causar um incidente de segurança.

### A Migração que Parou a Produção

O serviço do DICT precisa de uma nova coluna no PostgreSQL. O dev cria a migration, testa localmente (`npm run migrate:up` — funciona), faz o PR, merge. Só que em produção, a migration trava porque a tabela tem 15 milhões de linhas e o `ALTER TABLE ADD COLUMN` com default value trava a tabela inteira por 12 minutos. O DICT — o serviço que processa todas as consultas de chave PIX do Brasil — fica indisponível. O parceiro do BACEN começa a ver timeouts. O telefone do CTO toca.

Se a migration tivesse sido testada em staging — que tem um snapshot anonimizado dos dados de produção — o problema seria descoberto antes. Se o pipeline tivesse uma etapa de `migration-plan` com `pgroll` ou `gh-ost`, a migração seria feita com zero downtime. Mas sem CI/CD, staging é um ambiente abandonado que ninguém atualiza há 3 meses e que tem 50 registros na tabela — completamente inútil pra testar migrations.

### O Deploy que Funciona no Staging e Explode em Produção

O time de infra criou um cluster Kubernetes novo. Staging roda no cluster velho (v1.27, node groups t3.medium). Produção roda no cluster novo (v1.29, node groups c5.xlarge com ARM64). O time de dev não sabe disso — eles só recebem um `kubeconfig` pra cada ambiente e não olham os detalhes.

O serviço de webhooks faz deploy em staging. Testa. Tudo ok. Deploy em produção. O pod não sobe. CrashLoopBackOff. Log: `exec /usr/local/bin/node: no such file or directory`. O que aconteceu? A imagem Docker foi buildada pra `linux/amd64`, mas o node group de produção é ARM64 (`linux/arm64`). A imagem não é compatível.

Se o CI/CD usasse **multi-arch builds** (`docker buildx build --platform linux/amd64,linux/arm64`), isso nunca teria acontecido. Se houvesse um **smoke test automatizado** que sobe o pod e verifica o health, o deploy seria barrado automaticamente. Mas sem CI/CD, o erro só aparece quando o cliente já está sentindo.

### A Solução

Cada um desses problemas tem solução via pipeline:

| Problema | Solução no Pipeline |
|----------|-------------------|
| Config errada em produção | Secrets injection via Vault/Secrets Manager, validação de env vars |
| Build desnecessário em monorepo | Turborepo com cache distribuído e `--filter` |
| Compliance (BACEN) | Workflow runs auditáveis, logs imutáveis, approval gates |
| Secret vazado em commit | TruffleHog no CI, `.gitignore` validado, pre-commit hooks |
| Migration trava produção | Teste em staging com dados realistas, `pgroll`/`gh-ost` |
| Imagem incompatível com arquitetura | Multi-arch builds (`docker buildx`) |

Nenhuma dessas soluções exige um exército de DevOps. É tudo configurável em arquivos YAML que vivem no repositório, versionados, revisáveis em PR, e auditáveis. **CI/CD não é uma tecnologia — é uma prática de engenharia de software.**

---

## 🏗️ Arquitetura do Pipeline

<LanguageToggle />

<div class="Lang-content gha" style="Display:block;">

### Visão Macro — Do Commit ao Deploy

O pipeline da nossa monorepo é um grafo acíclico dirigido (DAG) de jobs. Cada job é uma etapa que produz artefatos consumidos pela etapa seguinte. O motor de orquestração é o GitHub Actions, mas o design é portável pra qualquer plataforma (GitLab CI, CircleCI, Jenkins).

```mermaid
flowchart TB
    subgraph "Triggers"
        PR[Pull Request → feature/*]
        MAIN[Push to main]
        TAG[Tag v*.*.*]
        CRON[Cron: nightly security scan]
    end

    subgraph "CI — Continuous Integration"
        LINT[🧹 Lint & TypeCheck<br/>eslint + prettier + tsc]
        UNIT_KARMA[🧪 Unit Tests<br/>matrix: ledger, dict, iso8583<br/>vitest --coverage]
        SAST_BLOCK[🔒 SAST Scan<br/>CodeQL + Semgrep + TruffleHog<br/>⚠️ BLOCK on CRITICAL]
        DEP_CHECK[📦 Dependency Check<br/>npm audit + license compliance<br/>⚠️ BLOCK on GPL]
        BUILD_DOCKER[🐳 Docker Build & Push<br/>buildx multi-arch<br/>cache: GHA]
        INT_TEST[🔗 Integration Tests<br/>docker-compose up<br/>testcontainers]
    end

    subgraph "CD — Continuous Deployment"
        DEV_DEPLOY[🟢 Deploy Dev<br/>auto on push to main<br/>namespace: dev]
        STG_DEPLOY[🟡 Deploy Staging<br/>auto on tag v*-rc*<br/>namespace: staging]
        E2E_TEST[🎭 E2E Tests<br/>Playwright + k6 smoke]
        PERF_TEST[⚡ Performance Test<br/>k6 load: 1000 RPS]
        MIGRATE_STG[🗄️ Migration Plan<br/>pgroll dry-run<br/>MongoDB balancer prep]
        APPROVAL[✋ Manual Approval<br/>BACEN compliance gate<br/>CODEOWNERS required]
        PROD_DEPLOY[🔴 Deploy Production<br/>Blue/Green strategy<br/>namespace: production]
        CANARY[🐤 Canary Release<br/>5% → 25% → 100%<br/>15min observation]
        MONITOR[📊 Monitor<br/>Grafana + Prometheus<br/>error rate < 1%]
        ROLLBACK[⏪ Instant Rollback<br/>switch service selector<br/>MTTR < 60s]
    end

    subgraph "Artifacts"
        REGISTRY[(GitHub Container Registry<br/>ghcr.io/banking/service)]
        COVERAGE[(📈 Codecov<br/>coverage reports)]
        SBOM[(📋 SBOM<br/>CycloneDX JSON)]
    end

    PR --> LINT
    LINT --> UNIT_KARMA
    UNIT_KARMA --> SAST_BLOCK
    SAST_BLOCK --> DEP_CHECK
    DEP_CHECK --> BUILD_DOCKER
    BUILD_DOCKER --> REGISTRY
    BUILD_DOCKER --> INT_TEST
    INT_TEST --> COVERAGE

    MAIN --> DEV_DEPLOY
    TAG --> STG_DEPLOY
    STG_DEPLOY --> E2E_TEST
    STG_DEPLOY --> MIGRATE_STG
    E2E_TEST --> PERF_TEST
    PERF_TEST --> APPROVAL
    APPROVAL --> PROD_DEPLOY
    PROD_DEPLOY --> CANARY
    CANARY --> MONITOR
    MONITOR -->|Healthy| SUCCESS[✅ Deploy OK]
    MONITOR -->|Failed| ROLLBACK
    ROLLBACK -->|Revert| PROD_DEPLOY

    CRON --> SAST_BLOCK
    CRON --> DEP_CHECK

    BUILD_DOCKER --> SBOM

    style SAST_BLOCK fill:#dc2626,color:#fff,stroke:#b91c1c
    style DEP_CHECK fill:#dc2626,color:#fff,stroke:#b91c1c
    style PROD_DEPLOY fill:#059669,color:#fff,stroke:#047857
    style CANARY fill:#f59e0b,color:#000,stroke:#d97706
    style ROLLBACK fill:#7c3aed,color:#fff,stroke:#6d28d9
    style APPROVAL fill:#3b82f6,color:#fff,stroke:#2563eb
    style REGISTRY fill:#0891b2,color:#fff,stroke:#0e7490
```

### Fluxo Completo de uma Feature até Produção

Esse diagrama conta a história completa. Uma feature passa por 17 checkpoints antes de chegar ao usuário final:

```mermaid
sequenceDiagram
    actor Dev as 👩‍💻 Developer
    participant GH as 🐙 GitHub
    participant CI as ⚙️ CI Runner
    participant SAST as 🔒 Security Scanner
    participant REG as 🐳 GHCR
    participant STG as 🟡 Staging K8s
    participant E2E as 🎭 Playwright
    participant APPROVER as 👔 Tech Lead
    participant PROD as 🔴 Production K8s
    participant MON as 📊 Grafana

    Dev->>GH: git push origin feature/xxx
    GH->>CI: workflow: pull_request
    CI->>CI: pnpm install (frozen lockfile)
    CI->>CI: turbo run lint typecheck
    CI->>CI: turbo run test --filter=[HEAD^1]
    Note over CI: Only tests changed services
    CI->>SAST: CodeQL init + analyze
    SAST-->>CI: 0 critical, 2 low (non-blocking)
    CI->>SAST: Semgrep scan (custom rules)
    SAST-->>CI: 0 findings
    CI->>SAST: TruffleHog (secrets detection)
    SAST-->>CI: All clear
    CI->>SAST: npm audit --audit-level=high
    SAST-->>CI: 0 high/critical
    CI-->>GH: ✅ All checks passed

    Dev->>GH: Merge PR → main
    GH->>CI: workflow: push main
    CI->>CI: turbo run build --filter=[HEAD^1]
    CI->>REG: docker buildx build --push
    Note over CI,REG: Multi-arch: amd64 + arm64
    REG-->>CI: ghcr.io/banking/ledger:sha-abc123
    CI->>STG: kubectl set image deploy/ledger
    STG->>STG: rollout status (timeout=5m)
    STG-->>CI: Staging ready

    CI->>CI: docker-compose -f docker-compose.e2e.yml up
    CI->>E2E: npx playwright test --project=e2e
    E2E-->>CI: 47 passed, 0 failed
    CI->>CI: k6 run smoke-test.js
    Note over CI: 100 VUs, 5min, <1% errors

    CI->>GH: Create Deployment (environment: production)
    GH->>APPROVER: 🔔 Review requested
    Note over APPROVER: BACEN compliance: someone<br/>who didn't write the code<br/>must approve
    APPROVER->>GH: ✅ Approved (with comment)

    GH->>CI: workflow: deployment (production)
    CI->>CI: Read current active color (Blue/Green)
    Note over CI: Current: Blue → Deploy to Green
    CI->>PROD: kubectl apply -f green-deployment.yaml
    PROD->>PROD: Init containers + readiness probe
    PROD-->>CI: Green pods ready (3/3)
    CI->>PROD: Smoke test: curl /health
    PROD-->>CI: 200 OK (42ms)
    CI->>PROD: kubectl patch svc → selector: green
    Note over PROD: Traffic switched to Green<br/>Blue still alive (standby)

    CI->>CI: Canary: 5% → monitor 5min
    MON-->>CI: Error rate: 0.02% (< 1% ✓)
    CI->>CI: Canary: 25% → monitor 5min
    MON-->>CI: Error rate: 0.01% (< 1% ✓)
    CI->>CI: Canary: 100% → monitor 5min
    MON-->>CI: Error rate: 0.03% (< 1% ✓)

    CI->>CI: kubectl scale deploy/ledger-blue --replicas=0
    Note over CI: Blue decommissioned<br/>Green is now production
    CI-->>GH: ✅ Deploy Complete

    Note over Dev,GH: If error rate > 1% at any canary step:
    CI->>PROD: kubectl patch svc → selector: blue
    Note over PROD: Instant rollback (< 60s)<br/>Green pods preserved for debugging
```

Cada arrow nesse diagrama é um log auditável. Cada decisão é registrada. Se o BACEN pedir 'prove que o deploy de 15 de março às 14h32 foi testado e aprovado', você aponta pra esse workflow run e mostra cada step.

### Promoção de Ambientes

O fluxo de ambientes é unidirecional e gera artefatos imutáveis:

```mermaid
stateDiagram-v2
    [*] --> Dev: git push main
    Dev --> Staging: git tag v1.2.3-rc1
    Staging --> ManualApproval: E2E + Perf pass
    ManualApproval --> Production: Approved + git tag v1.2.3
    Production --> Shadow: Mirror 5% traffic (optional)
    Production --> [*]

    state Dev {
        [*] --> DevBuild: turbo build
        DevBuild --> DevDeploy: kubectl apply
        DevDeploy --> DevSmoke: curl /health
    }

    state Staging {
        [*] --> StgMigrate: pgroll plan
        StgMigrate --> StgDeploy: kubectl apply
        StgDeploy --> StgE2E: Playwright full suite
        StgE2E --> StgPerf: k6 load test
    }

    state Production {
        [*] --> BlueGreen: Deploy to inactive color
        BlueGreen --> SmokeTest: curl /health
        SmokeTest --> Canary5: 5% traffic
        Canary5 --> Canary25: 25% traffic
        Canary25 --> Canary100: 100% traffic
        Canary100 --> Cleanup: Scale down old pods
    }

    state ManualApproval {
        [*] --> CodeOwners: Required reviewers
        CodeOwners --> SecurityReview: If security/ path changed
        SecurityReview --> Approve: Gate passed
    }
```

**Por que a promoção é unidirecional?** Porque você nunca quer que código de produção contamine ambientes inferiores. A imagem que roda em produção é a **mesma imagem** que passou por dev e staging — só muda a configuração (injetada via secrets e configmaps). Isso garante que o que você testou em staging é **exatamente** o que vai pra produção. Sem rebuild. Sem 'funciona no meu laptop'. Sem surpresas.

### Estrutura de Diretórios

```
.github/
├── workflows/
│   ├── ci.yml                 # CI: lint, test, SAST, build
│   ├── cd-staging.yml         # CD: deploy staging
│   ├── cd-production.yml      # CD: deploy production (Blue/Green + Canary)
│   ├── nightly-security.yml   # Nightly: full SAST + DAST + dependency audit
│   └── release.yml            # Release: changelog + tag + SBOM
├── actions/
│   ├── build-docker/action.yml        # Composite: build + scan + push
│   ├── deploy-k8s/action.yml          # Composite: kubectl deploy + health check
│   ├── run-migrations/action.yml      # Composite: pgroll plan/apply with safety checks
│   └── canary-release/action.yml      # Composite: gradual traffic shift + monitoring
├── codeql/
│   └── codeql-config.yml      # CodeQL custom queries for fintech
├── dependabot.yml             # Auto dependency updates
└── CODEOWNERS                 # Approval gates por pasta
```

### Workflow CI — O Coração do Pipeline

```yaml
name: CI Pipeline
on:
  pull_request:
    branches: [main]
    paths-ignore: ['docs/**', '*.md']
  push:
    branches: [main]
    paths-ignore: ['docs/**', '*.md']

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_API: 'http://127.0.0.1:9080'
  TURBO_TOKEN: 'local-token'
  TURBO_TEAM: 'banking'

jobs:
  lint-and-typecheck:
    name: 🧹 Lint & TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: '9' }

      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Start turborepo cache server
        uses: dtinth/setup-github-actions-caching-for-turbo@v1

      - name: Lint all packages
        run: pnpm turbo run lint

      - name: TypeCheck all packages
        run: pnpm turbo run typecheck

  unit-tests:
    name: 🧪 Unit Tests (${{ matrix.service }})
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        service: [ledger, dict, iso8583, auth, webhooks, billing]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: --health-cmd "Redis-cli ping" --health-interval 10s
      mongodb:
        image: mongo:7
        ports: ['27017:27017']
        options: >-
          --health-cmd "Mongosh --eval 'db.runCommand({ ping: 1 })'"
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: '9' }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm turbo run test --filter=${{ matrix.service }} -- --coverage --ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          flags: ${{ matrix.service }}
          directory: apps/${{ matrix.service }}/coverage
          fail_ci_if_error: true

  security-scan:
    name: 🔒 Security Scan
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: CodeQL Init
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript, go
          config-file: ./.github/codeql/codeql-config.yml
          queries: security-extended,security-and-quality

      - name: CodeQL Analyze
        uses: github/codeql-action/analyze@v3
        with:
          category: '/language:${{ matrix.language }}'

      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/typescript
            p/golang
            p/dockerfile
            p/kubernetes
          severity: ERROR
          publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: TruffleHog Secrets Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.before }}
          head: ${{ github.sha }}
          extra_args: --only-verified

      - name: Dependency License Check
        run: |
          npx license-checker \
            --production \
            --onlyAllow 'MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;Unlicense;CC0-1.0;Python-2.0;BlueOak-1.0.0' \
            --excludePrivatePackages \
            --summary

      - name: npm audit
        run: pnpm audit --audit-level=high
        continue-on-error: false

  build-and-push:
    name: 🐳 Build & Push (${{ matrix.service }})
    needs: [unit-tests, security-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        service: [ledger, dict, iso8583, auth, webhooks, billing]
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/${{ matrix.service }}
          tags: |
            type=sha,format=short
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/${{ matrix.service }}/Dockerfile
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha,scope=${{ matrix.service }}
          cache-to: type=gha,mode=max,scope=${{ matrix.service }}
          provenance: mode=max
          sbom: true

      - name: Trivy vulnerability scan (post-build)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results-${{ matrix.service }}.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '0'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results-${{ matrix.service }}.sarif
          category: trivy-${{ matrix.service }}
```

### Docker Multi-Stage Build

Cada serviço tem um `Dockerfile` que usa multi-stage builds pra minimizar o tamanho da imagem final e eliminar dependências de build:

```dockerfile
# Stage 1: Dependencies — cacheável via lockfile hash
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ledger/package.json ./apps/ledger/
COPY packages/shared/package.json ./packages/shared/
RUN corepack enable && pnpm install --frozen-lockfile --prod

# Stage 2: Build — compila TypeScript, roda em paralelo
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm turbo run build --filter=ledger

# Stage 3: Production — imagem mínima (~120MB)
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S banking && adduser -S banking -G banking && \
    apk add --no-cache tini curl

COPY --from=build --chown=banking:banking /app/apps/ledger/dist ./dist
COPY --from=deps --chown=banking:banking /app/apps/ledger/node_modules ./node_modules
COPY --from=deps --chown=banking:banking /app/packages/shared ./packages/shared

USER banking
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["Node", "Dist/index.js"]
```

Três decisões de design aqui:

1. **`pnpm install --prod` no estágio de deps** — Só instala o que vai pra produção. Dev dependencies como `vitest`, `eslint`, `typescript` ficam no estágio de build e nunca chegam na imagem final. Isso reduz a superfície de ataque: menos pacotes = menos CVEs.

2. **`tini` como entrypoint** — O Node.js não foi feito pra ser PID 1 em container. Ele não trata sinais POSIX corretamente (SIGTERM, SIGINT). O `tini` é um init mínimo que faz reaping de processos zumbis e repassa sinais pro processo Node. Sem `tini`, quando o Kubernetes mandar `SIGTERM` pra fazer graceful shutdown, o Node pode ignorar e ser morto com `SIGKILL` depois de 30 segundos — perdendo requisições em flight.

3. **HEALTHCHECK no Dockerfile** — O Kubernetes usa `readinessProbe`, mas ter um HEALTHCHECK no Dockerfile é defense in depth. Se você rodar o container fora do K8s (local dev, docker-compose, testes), ele ainda tem health check.

### Go Dockerfile

```dockerfile
# Stage 1: Build Go binary
FROM golang:1.22-alpine AS build
WORKDIR /app
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X main.version=${VERSION} -X main.commit=${COMMIT}" \
    -o /app/bin/ledger ./cmd/ledger

# Stage 2: Scratch — imagem final ~8MB
FROM scratch
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/bin/ledger /ledger

USER 1001:1001
EXPOSE 8080
ENTRYPOINT ["/ledger"]
```

Aqui o truque é o `FROM scratch`. Imagem vazia — sem shell, sem libc, sem `ls`, sem `curl`. O binário Go compilado com `CGO_ENABLED=0` é estaticamente linkado e não precisa de libc. O resultado é uma imagem de **~8MB**. Compara com os 120MB do Node.js. Em Kubernetes, isso significa que o pod sobe em milissegundos em vez de segundos. Em um cenário de auto-scaling, isso faz diferença real na latência percebida pelo usuário.

O `-ldflags` injeta metadados no binário: versão e commit. Você pode expor isso via endpoint `/version` e saber exatamente qual commit está rodando em cada pod.

### Workflow CD Production — Blue/Green com Canary

```yaml
name: CD Production
on:
  deployment:
    environments: [production]
  workflow_dispatch:
    inputs:
      service:
        description: 'Service to deploy'
        required: true
        type: choice
        options: [ledger, dict, iso8583, auth, webhooks, billing]

jobs:
  blue-green-deploy:
    name: 🔴 Deploy ${{ inputs.service }}
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.banking.com.br
    concurrency:
      group: deploy-${{ inputs.service }}
      cancel-in-progress: false

    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v4
        with:
          version: 'v1.29'

      - name: Configure kubeconfig
        uses: azure/k8s-set-context@v4
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_PRODUCTION }}

      - name: Determine current active color
        id: color
        run: |
          CURRENT=$(kubectl get svc ${{ inputs.service }} \
            -n production \
            -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "Blue")
          NEXT=$([ "$CURRENT" == "Blue" ] && echo "Green" || echo "Blue")
          echo "Current=$CURRENT" >> $GITHUB_OUTPUT
          echo "Next=$NEXT" >> $GITHUB_OUTPUT
          echo "🔄 Current: $CURRENT → Next: $NEXT"

      - name: Deploy to inactive color
        run: |
          kubectl apply -f k8s/production/${{ inputs.service }}-${{ steps.color.outputs.next }}.yaml
          kubectl rollout status \
            deployment/${{ inputs.service }}-${{ steps.color.outputs.next }} \
            -n production \
            --timeout=10m

      - name: Health check (smoke test)
        run: |
          GREEN_IP=$(kubectl get pods \
            -n production \
            -l app=${{ inputs.service }},color=${{ steps.color.outputs.next }} \
            -o jsonpath='{.items[0].status.podIP}')
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://$GREEN_IP:8080/health)
            if [ "$STATUS" == "200" ]; then
              echo "✅ Health check passed"
              exit 0
            fi
            sleep 3
          done
          echo "❌ Health check failed after 10 attempts"
          exit 1

      - name: Switch traffic (instant cutover)
        run: |
          kubectl patch svc ${{ inputs.service }} -n production \
            -p "{\"Spec\":{\"Selector\":{\"App\":\"${{ inputs.service }}\",\"Color\":\"${{ steps.color.outputs.next }}\"}}}"
          echo "🚦 Traffic switched from ${{ steps.color.outputs.current }} to ${{ steps.color.outputs.next }}"

      - name: Canary observation (15 min)
        run: |
          for pct in 5 25 100; do
            echo "🐤 Canary at $pct% — observing for 5 minutes..."
            sleep 300
            ERROR_RATE=$(curl -s "Http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])/rate(http_requests_total[5m])*100" | jq '.data.result[0].value[1]' | tr -d '"')
            echo "   Error rate: $ERROR_RATE%"
            if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
              echo "❌ Error rate exceeded 1% at $pct% canary"
              exit 1
            fi
          done
          echo "✅ Canary complete — all healthy"

      - name: Decommission old pods
        run: |
          kubectl scale deployment/${{ inputs.service }}-${{ steps.color.outputs.current }} \
            -n production --replicas=0
          echo "🧹 Old pods (${{ steps.color.outputs.current }}) decommissioned"

  rollback:
    name: ⏪ Emergency Rollback
    needs: blue-green-deploy
    if: failure() && github.event_name != 'workflow_dispatch'
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - name: Instant rollback
        run: |
          PREVIOUS=$(kubectl get svc ${{ inputs.service }} \
            -n production \
            -o jsonpath='{.metadata.annotations.previous-color}')
          kubectl patch svc ${{ inputs.service }} -n production \
            -p "{\"Spec\":{\"Selector\":{\"App\":\"${{ inputs.service }}\",\"Color\":\"$PREVIOUS\"}}}"
          echo "⏪ Rollback complete — traffic back to $PREVIOUS"

      - name: Notify on-call
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "Channel": "#ops-alerts",
              "Text": "🚨 ROLLBACK: ${{ inputs.service }} deployment failed. Traffic reverted to previous version. Check workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_OPS_WEBHOOK }}
```

### Composite Action — Build Docker Reutilizável

```yaml
# .github/actions/build-docker/action.yml
name: 'Build Docker Image'
description: 'Build, scan, and push Docker image with Trivy vulnerability check'
inputs:
  app-name:
    description: 'Application name'
    required: true
  dockerfile:
    description: 'Path to Dockerfile'
    required: false
    default: 'Dockerfile'
  context:
    description: 'Build context'
    required: false
    default: '.'
  registry:
    description: 'Container registry'
    required: true
  tags:
    description: 'Image tags (comma-separated)'
    required: true
  platforms:
    description: 'Target platforms'
    required: false
    default: 'linux/amd64,linux/arm64'
  scan-severity:
    description: 'Trivy severity to fail on'
    required: false
    default: 'CRITICAL'

outputs:
  image-digest:
    description: 'Pushed image digest'
    value: ${{ steps.build.outputs.digest }}

runs:
  using: 'composite'
  steps:
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ inputs.registry }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push
      id: build
      uses: docker/build-push-action@v5
      with:
        context: ${{ inputs.context }}
        file: ${{ inputs.dockerfile }}
        platforms: ${{ inputs.platforms }}
        push: true
        tags: ${{ inputs.tags }}
        cache-from: type=gha,scope=${{ inputs.app-name }}
        cache-to: type=gha,mode=max,scope=${{ inputs.app-name }}
        provenance: mode=max
        sbom: true

    - name: Vulnerability scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: '${{ inputs.registry }}/${{ github.repository }}/${{ inputs.app-name }}:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-${{ inputs.app-name }}.sarif'
        severity: ${{ inputs.scan-severity }},HIGH
        exit-code: '1'
```

### Database Migrations no Pipeline

Toda migration segue o fluxo: **plan (staging) → review (automated) → apply (production with safety checks)**.

```yaml
# .github/actions/run-migrations/action.yml
name: 'Run Database Migrations'
description: 'Plan and apply database migrations with safety gates'
inputs:
  database:
    description: 'Database type (postgresql | mongodb)'
    required: true
  environment:
    description: 'Target environment'
    required: true
  migration-dir:
    description: 'Path to migrations directory'
    required: false
    default: './migrations'
  dry-run:
    description: 'Plan only, do not apply'
    required: false
    default: 'false'

runs:
  using: 'composite'
  steps:
    - name: Validate migration files
      shell: bash
      run: |
        MIGRATIONS=$(find ${{ inputs.migration-dir }} -name "*.sql" -o -name "*.ts" | sort)
        if [ -z "$MIGRATIONS" ]; then
          echo "No migrations found"
          exit 0
        fi
        echo "Found migrations:"
        echo "$MIGRATIONS"

    - name: Check for destructive operations
      shell: bash
      run: |
        if grep -rq "DROP TABLE\|DROP COLUMN\|TRUNCATE" ${{ inputs.migration-dir }}/; then
          echo "⚠️  WARNING: Destructive operations detected!"
          echo "These will require manual approval."
        fi

    - name: Plan migration (dry-run)
      if: inputs.database == 'postgresql'
      shell: bash
      run: |
        npx pgroll plan \
          --database-url ${{ secrets.DATABASE_URL }} \
          --migrations-dir ${{ inputs.migration-dir }} \
          --environment ${{ inputs.environment }}

    - name: Apply migration
      if: inputs.dry-run == 'false'
      shell: bash
      run: |
        if [ "${{ inputs.database }}" == "Postgresql" ]; then
          npx pgroll apply \
            --database-url ${{ secrets.DATABASE_URL }} \
            --migrations-dir ${{ inputs.migration-dir }} \
            --environment ${{ inputs.environment }} \
            --lock-timeout 5s
        elif [ "${{ inputs.database }}" == "Mongodb" ]; then
          npx migrate-mongo up \
            --file ${{ inputs.migration-dir }}/migrate-mongo-config.js
        fi

    - name: Verify migration
      shell: bash
      run: |
        if [ "${{ inputs.database }}" == "Postgresql" ]; then
          npx pgroll verify \
            --database-url ${{ secrets.DATABASE_URL }} \
            --environment ${{ inputs.environment }}
        fi
```

</div>

<div class="Lang-content glci" style="Display:none;">

### GitLab CI — Pipeline Self-Hosted

Para times que precisam rodar CI em infraestrutura própria (dados sensíveis on-prem, compliance BACEN que exige que código não saia do datacenter brasileiro), GitLab CI com runners self-hosted é a escolha natural:

```yaml
stages:
  - validate
  - test
  - security
  - build
  - deploy-staging
  - e2e
  - approve
  - deploy-production
  - monitor

variables:
  TURBO_API: 'http://turbo-cache:9080'
  DOCKER_HOST: tcp://docker:2375
  DOCKER_TLS_CERTDIR: ""

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "Merge_request_event"
    - if: $CI_COMMIT_BRANCH == "Main"
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+/

lint:
  stage: validate
  image: node:20-alpine
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm turbo run lint
    - pnpm turbo run typecheck

test-unit:
  stage: test
  image: node:20-alpine
  services:
    - postgres:16-alpine
    - redis:7-alpine
    - mongo:7
  variables:
    POSTGRES_DB: test
    POSTGRES_PASSWORD: test
    MONGO_INITDB_DATABASE: test
  parallel:
    matrix:
      - SERVICE: [ledger, dict, iso8583, auth, webhooks, billing]
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm turbo run test --filter=$SERVICE -- --coverage --ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: apps/$SERVICE/coverage/cobertura-coverage.xml

sast:
  stage: security
  include:
    - template: Security/SAST.gitlab-ci.yml
    - template: Security/Secret-Detection.gitlab-ci.yml
    - template: Security/Dependency-Scanning.gitlab-ci.yml
  variables:
    SAST_EXCLUDED_PATHS: "Docs,*.md,*.json"
    SECRET_DETECTION_HISTORIC_SCAN: "True"

container-scanning:
  stage: security
  include:
    - template: Security/Container-Scanning.gitlab-ci.yml
  variables:
    CS_IMAGE: $CI_REGISTRY_IMAGE/$SERVICE:$CI_COMMIT_SHA
    CS_DOCKERFILE_PATH: apps/$SERVICE/Dockerfile

build-docker:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  parallel:
    matrix:
      - SERVICE: [ledger, dict, iso8583, auth, webhooks, billing]
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker buildx build
      --platform linux/amd64,linux/arm64
      --cache-from type=registry,ref=$CI_REGISTRY_IMAGE/$SERVICE:cache
      --cache-to type=registry,ref=$CI_REGISTRY_IMAGE/$SERVICE:cache,mode=max
      -t $CI_REGISTRY_IMAGE/$SERVICE:$CI_COMMIT_SHA
      -t $CI_REGISTRY_IMAGE/$SERVICE:latest
      -f apps/$SERVICE/Dockerfile
      --push .

deploy-staging:
  stage: deploy-staging
  environment:
    name: staging
    url: https://staging-api.banking.com.br
  script:
    - kubectl config use-context banking/staging
    - kubectl set image deployment/$SERVICE
      $SERVICE=$CI_REGISTRY_IMAGE/$SERVICE:$CI_COMMIT_SHA
      --namespace=staging
    - kubectl rollout status deployment/$SERVICE
      --namespace=staging
      --timeout=10m

e2e-tests:
  stage: e2e
  environment:
    name: staging
  image: mcr.microsoft.com/playwright:v1.40-focal
  script:
    - npx playwright test --project=e2e --reporter=junit
  artifacts:
    reports:
      junit: playwright-report/results.xml

deploy-production:
  stage: deploy-production
  environment:
    name: production
    url: https://api.banking.com.br
  when: manual
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
  script:
    - |
      CURRENT=$(kubectl get svc $SERVICE -n production -o jsonpath='{.spec.selector.color}')
      NEXT=$([ "$CURRENT" == "Blue" ] && echo "Green" || echo "Blue")
      echo "🔄 Deploying to $NEXT"
      kubectl apply -f k8s/production/$SERVICE-$NEXT.yaml
      kubectl rollout status deployment/$SERVICE-$NEXT -n production --timeout=10m
      kubectl patch svc $SERVICE -n production -p "{\"Spec\":{\"Selector\":{\"Color\":\"$NEXT\"}}}"

auto-devops:
  include:
    - template: Auto-DevOps.gitlab-ci.yml
  variables:
    AUTO_DEVOPS_PLATFORM_TARGET: kubernetes
    PRODUCTION_STRATEGY: manual
    STAGING_ENABLED: "True"
    CANARY_ENABLED: "True"
```

</div>

---

## 👨‍💻 Mão na Massa

"Bora codar. O bagulho é o seguinte: você vai construir um pipeline de CI/CD que cubra tudo — do lint ao Blue/Green em produção — pra uma monorepo com pnpm, turborepo, e Kubernetes. O pipeline precisa ser modular, reutilizável, e compatível com BACEN. Sem atalho. Sem 'funcionou na minha máquina'. Sem deploy manual.

### Por que Monorepo com Turborepo?

Antes de meter código, entende o porquê. Monorepo é uma escolha arquitetural, não um modismo. Quando você tem 15 serviços que compartilham pacotes (`shared/types`, `shared/utils`, `shared/validation`), ter tudo no mesmo repo significa:

- **Atomic commits**: uma mudança no `shared/types` e nos serviços que dependem dele vai no mesmo PR. Sem coordenação entre 15 repositórios.
- **Versão única da verdade**: não existe 'versão 2.3 do shared vs versão 2.4' — todo mundo usa a mesma HEAD.
- **Refactoring cross-cutting**: mudar uma interface e todos os consumers de uma vez.

O preço que você paga é **complexidade de build**. Sem turborepo, cada PR builda 15 serviços que não mudaram. Com turborepo, o `--filter=[HEAD^1]` compara o diff do git e só builda/testa o que mudou.

```jsonc
// turbo.json
{
  "$schema": "Https://turborepo.org/schema.json",
  "Pipeline": {
    "Build": {
      "DependsOn": ["^build"],
      "Outputs": ["Dist/**", ".next/**"],
      "Cache": true
    },
    "Test": {
      "DependsOn": ["Build"],
      "Outputs": ["Coverage/**"],
      "Cache": true
    },
    "Lint": {
      "Cache": true
    },
    "Typecheck": {
      "DependsOn": ["^build"],
      "Cache": true
    },
    "Dev": {
      "Cache": false,
      "Persistent": true
    }
  }
}
```

O `^build` significa 'builda as dependências antes'. Se o `webhooks` depende de `shared/types`, o turborepo garante que `shared/types` builda primeiro. Isso é um DAG de dependências automático — você não precisa de Makefile nem script bash pra ordenar builds.

### Secrets Management — O Cofre do Pipeline

"Se você tem uma API key hardcoded no código, você já começou errado. Secret em código é secret público. Não importa se o repo é privado — eventualmente alguém faz fork, alguém tira print, alguém comita sem querer. O segredo que está no seu código-fonte **não é segredo**."

Camadas de proteção de secrets:

```yaml
# Layer 1: GitHub Environment Secrets (com approval gates)
# Settings → Environments → production → Secrets

# Layer 2: HashiCorp Vault (para secrets rotativos)
# Vault injeta secrets dinâmicos com TTL

# Layer 3: Sealed Secrets (para Kubernetes)
# Encrypted secrets versionados no Git
```

Uso no pipeline:

```yaml
jobs:
  deploy:
    environment: production
    steps:
      - name: Fetch secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_ADDR }}
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/production/ledger DATABASE_URL | DATABASE_URL ;
            secret/data/production/ledger REDIS_URL | REDIS_URL ;
            secret/data/production/ledger JWT_SECRET | JWT_SECRET

      - name: Inject into Kubernetes
        run: |
          kubectl create secret generic ledger-secrets \
            --from-literal=DATABASE_URL=${{ env.DATABASE_URL }} \
            --from-literal=JWT_SECRET=${{ env.JWT_SECRET }} \
            --dry-run=client -o yaml | kubectl apply -f -
```

O Vault é superior ao GitHub Secrets pra secrets que rotacionam. Imagina que você tem credenciais de banco de dados com TTL de 24h. Com GitHub Secrets, você precisaria atualizar manualmente a cada 24h. Com Vault, o pipeline busca credenciais novas a cada deploy — se expirar, o próximo deploy pega novas. E o Vault audita cada acesso.

### Canary Release Step-by-Step

O canary é o coração da segurança de deploy. A ideia é: se 5% dos usuários não quebraram em 5 minutos, sobe pra 25%. Se 25% não quebrou, sobe pra 100%. Se quebrou em qualquer etapa, rollback automático.

```typescript
// scripts/canary.ts — controlador de canary release
import { execSync } from 'child_process';

interface CanaryConfig {
  service: string;
  namespace: string;
  prometheusUrl: string;
  steps: { percentage: number; durationMinutes: number }[];
  maxErrorRate: number;
  canaryHeader: string; // e.g., 'x-canary: true'
}

async function canaryRelease(config: CanaryConfig) {
  for (const step of config.steps) {
    console.log(`🐤 Canary: ${step.percentage}% traffic — observing ${step.durationMinutes}min`);

    // Step 1: Route canary traffic
    updateIstioVirtualService(config.service, config.namespace, step.percentage, config.canaryHeader);

    // Step 2: Wait and observe
    await sleep(step.durationMinutes * 60 * 1000);

    // Step 3: Check metrics
    const errorRate = await fetchErrorRate(config.prometheusUrl, config.service, step.durationMinutes);

    console.log(`   Error rate: ${errorRate.toFixed(3)}% (max: ${config.maxErrorRate}%)`);

    if (errorRate > config.maxErrorRate) {
      console.error('❌ Error rate exceeded! Rolling back...');
      rollback(config.service, config.namespace);
      process.exit(1);
    }
  }

  console.log('✅ Canary complete — 100% traffic');
}

function updateIstioVirtualService(service: string, ns: string, pct: number, header: string) {
  execSync(`kubectl patch virtualservice ${service} -n ${ns} --type='json' -p='[{
    "Op": "Replace",
    "Path": "/spec/http/0/route/1/weight",
    "Value": ${pct}
  }]'`);
}

async function fetchErrorRate(prometheus: string, service: string, minutes: number): Promise<number> {
  const query = `rate(http_requests_total{service="${service}",status=~"5.."}[${minutes}m]) / rate(http_requests_total{service="${service}"}[${minutes}m]) * 100`;
  const res = await fetch(`${prometheus}/api/v1/query?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  return parseFloat(data.data.result[0]?.value[1] || '0');
}

function rollback(service: string, ns: string) {
  execSync(`kubectl rollout undo deployment/${service} -n ${ns}`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const config: CanaryConfig = {
  service: process.argv[2] || 'ledger',
  namespace: 'production',
  prometheusUrl: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
  steps: [
    { percentage: 5, durationMinutes: 5 },
    { percentage: 25, durationMinutes: 5 },
    { percentage: 100, durationMinutes: 5 },
  ],
  maxErrorRate: 1.0,
  canaryHeader: 'x-canary',
};

canaryRelease(config);
```

### Release Management — Changelog Automatizado

Release é mais que tag. É changelog, release notes, SBOM, e notificação:

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - name: Generate changelog
        uses: orhun/git-cliff-action@v3
        with:
          args: --latest --verbose
        env:
          OUTPUT: CHANGELOG.md

      - name: Generate SBOM
        uses: CycloneDX/gh-node-module-generatebom@v1
        with:
          path: ./
          output: sbom-${{ github.ref_name }}.json

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body_path: CHANGELOG.md
          files: sbom-${{ github.ref_name }}.json
          generate_release_notes: true
```

O SBOM (Software Bill of Materials) é uma exigência cada vez mais comum em compliance. É a lista completa de todas as dependências, versões, licenças e hashes — pra que, se uma vulnerabilidade for descoberta (tipo Log4Shell), você saiba em 30 segundos se seu sistema é afetado.

### Infrastructure as Code Validation

Antes de deployar infra, valida:

```yaml
validate-iac:
  runs-on: ubuntu-latest
  steps:
    - name: Validate Kubernetes manifests
      uses: azure/k8s-lint@v1
      with:
        manifests: k8s/

    - name: Terraform plan (dry-run)
      uses: hashicorp/terraform-github-actions@v2
      with:
        tf_actions_subcommand: plan
        tf_actions_working_dir: terraform/
```

---

## 🧠 A Profundidade

### Por que Blue/Green para Sistemas Financeiros?

"Sabe, deixa eu aprofundar nessa escolha. Blue/Green não é a única estratégia de deploy — tem Rolling, Canary puro, Recreate, A/B, Shadow. Mas pra sistema financeiro, Blue/Green é a que equilibra melhor **segurança** e **velocidade**.

**Rolling Update** é o padrão do Kubernetes: você sobe pods novos e vai matando os velhos gradualmente. Durante a transição, tráfego vai pras duas versões. O problema? Se a versão nova tem um bug que corrompe dados, **não tem como voltar atrás**. Os pods velhos já foram mortos. Você precisa fazer rollback de dados — que é muito mais complexo que rollback de deploy.

**Recreate** é ainda pior: mata todos os pods velhos e sobe os novos. Isso causa downtime. Em fintech, downtime de segundos pode significar centenas de PIX não processados.

**Canary Puro** (sem Blue/Green) roteia uma porcentagem do tráfego pra nova versão. Mas a versão velha continua recebendo a maior parte. Se o canary quebrar, você só remove a rota — rápido. Mas se a nova versão tem um bug de corrupção de dados, os 5% de usuários no canary já tiveram dados corrompidos antes de você perceber.

**Blue/Green** resolve isso mantendo duas versões completas em paralelo. Enquanto a Green (nova) está sendo testada, a Blue (velha) continua servindo 100% do tráfego. Você testa a Green isoladamente — health checks, smoke tests, integration tests. Só depois de validar, você faz o switch. E o switch é instantâneo — você só muda o seletor do Service Kubernetes.

A desvantagem? **Dobra o custo de infra durante o deploy**. Você tem duas vezes mais pods rodando. Mas pra fintech, o custo de rollback demorado é ordens de grandeza maior que o custo de pods extras por 15 minutos.

A Knight Capital teria sobrevivido com Blue/Green. Se o servidor que não recebeu o deploy estivesse configurado como 'Green' e os outros 7 como 'Blue', o sistema teria detectado a inconsistência no health check e abortado o switch. Em vez disso, as duas versões competiram ao mesmo tempo.

Em 2021, uma fintech brasileira que processava boletos fez um deploy com Rolling Update. A nova versão tinha um bug que atualizava o campo `status` com um enum errado ('PAID' em vez de 'PAID' — case sensitivity). O bug corrompeu 2% dos boletos antes do rollback. Foram 3 dias corrigindo dados manualmente. Blue/Green teria pego o bug no smoke test isolado, sem afetar tráfego real."

### Canary vs Blue/Green vs Rolling — Matriz de Decisão

| Critério | Blue/Green | Canary | Rolling |
|----------|------------|--------|---------|
| **Downtime** | Zero | Zero | Zero |
| **Rollback time** | Instantâneo (< 1s) | Instantâneo (< 1s) | Lento (pods antigos morrem) |
| **Custo de infra** | Dobro durante deploy | Leve aumento | Sem aumento |
| **Detecção de erro** | No smoke test isolado | No tráfego real (5%) | No tráfego real (todos) |
| **Corrupção de dados** | Zero risco (tráfego isolado) | Baixo risco (afeta canary %) | Alto risco (sem rollback limpo) |
| **Teste de carga real** | Só no smoke | Sim, tráfego real gradual | Sim, tráfego real |
| **Complexidade** | Média | Alta | Baixa (built-in K8s) |
| **Melhor para** | APIs críticas, DB migrations | APIs com feature flag, UI | Serviços stateless internos |

Pra fintech, a recomendação é:

- **Blue/Green** para serviços transacionais: Ledger, DICT, ISO 8583, Billing. Onde corrupção de dados é inaceitável.
- **Canary** para serviços de frontend: API Gateway, Dashboard, Admin. Onde o impacto de bug é UX, não dinheiro.
- **Rolling** para serviços de background: Scheduler, Reports, Webhooks. Onde latência de rollback não é crítica.

E tem um detalhe importante: você pode combinar Blue/Green + Canary. Faz o deploy Green isolado, testa, faz switch pra Green com 5% de canary, observa, sobe pra 100%. É o melhor dos dois mundos — mas adiciona complexidade. Só vale a pena pra serviços que movem muito dinheiro.

### SAST, DAST e Dependency Scanning — A Tríade da Segurança

"Sabe, segurança de pipeline não é botar um CodeQL e chamar de 'secure SDLC'. Segurança de verdade tem três camadas que se complementam:"

**SAST (Static Application Security Testing)** — Analisa código-fonte sem executá-lo. Procura por padrões de vulnerabilidade: SQL injection, XSS, hardcoded secrets, buffer overflow, path traversal.

Ferramentas:
- **CodeQL** (GitHub): Faz data flow analysis — consegue rastrear se um input do usuário chega num `eval()` sem sanitização.
- **Semgrep**: Regras customizadas. Você pode escrever regras específicas pro seu domínio: "Ninguém pode importar `crypto` sem antes importar `@banking/crypto-wrapper`".
- **SonarQube**: Análise de qualidade + segurança, com histórico e debt tracking.

**DAST (Dynamic Application Security Testing)** — Ataca a aplicação rodando, como um hacker faria. Envia payloads maliciosos (SQL injection, XSS, command injection) e verifica se a aplicação é vulnerável.

Ferramentas:
- **OWASP ZAP**: Crawler + scanner automatizado. Você sobe seu app num container, aponta o ZAP, e ele vasculha endpoints.
- **Burp Suite**: Mais avançado, permite customizar ataques.

DAST no pipeline:

```yaml
dast-scan:
  runs-on: ubuntu-latest
  services:
    app:
      image: ghcr.io/banking/ledger:${{ github.sha }}
      ports: ['8080:8080']
  steps:
    - uses: zaproxy/action-full-scan@v0.10
      with:
        target: 'http://localhost:8080'
        fail_on_alert: 'High'
        cmd_options: '-a -j'
```

**Dependency Scanning** — Verifica se suas dependências têm CVEs conhecidas. O NPM ecosystem tem em média 1 nova CVE crítica por semana. Sem scanning, você está rodando com vulnerabilidades conhecidas que hackers também conhecem.

Ferramentas:
- **npm audit** / **pnpm audit**: Nível de projeto.
- **Trivy**: Scaneia o container inteiro — não só npm, mas também bibliotecas do sistema operacional, binários, certificados.
- **Snyk**: Vai além de CVE — analisa qualidade de código das dependências, popularidade, atividade de manutenção.
- **Dependabot** / **Renovate**: Automatiza PRs de atualização de dependências.

Pipeline integrado:

```yaml
dependency-defense:
  steps:
    - name: npm audit (dev + prod)
      run: pnpm audit --audit-level=moderate

    - name: License compliance
      run: |
        npx license-checker --production --failOn 'GPL;AGPL;LGPL'

    - name: Trivy filesystem scan
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        severity: 'HIGH,CRITICAL'
        exit-code: '1'
```

**Por que três ferramentas?** Porque cada uma vê coisas diferentes. O npm audit vê vulnerabilidades reportadas no NVD (National Vulnerability Database) pra pacotes npm. O Trivy vê vulnerabilidades em bibliotecas do sistema operacional (OpenSSL, libc, zlib) que o npm audit não vê. O license-checker vê se você está usando GPL — que obriga você a abrir seu código fonte, um problema legal enorme pra fintech.

E tem uma camada extra que pouca gente faz: **SBOM diff**. A cada build, você gera um SBOM (CycloneDX) e compara com o SBOM do build anterior. Se uma nova dependência apareceu — ou uma dependência mudou de versão — você é alertado. Isso evita ataques de supply chain onde um pacote legítimo é comprometido (tipo o evento `event-stream` de 2018).

### Docker Registry — Onde Suas Imagens Moram

"Você precisa de um lugar pra guardar suas imagens Docker. As opções:"

| Registry | Setup | Segurança | Cache | Custo |
|----------|-------|-----------|-------|-------|
| **GitHub Container Registry (GHCR)** | Zero setup (GitHub nativo) | RBAC integrado com GitHub | GHA cache layer | Gratuito (storage incluso) |
| **Harbor** | Self-hosted (Helm chart) | Vulnerability scanning nativo, assinatura de imagem, políticas de retenção | Proxy cache de registries externos | Custo do cluster |
| **AWS ECR** | Zero setup (AWS nativo) | IAM policies, image scanning | Pull-through cache | $0.10/GB/mês |
| **Docker Hub** | Zero setup | Limitado no free tier | Rate limit severo (100 pulls/6h free) | $5/mês pro |

Pra fintech brasileira: **GHCR + Harbor**. GHCR pra imagens públicas ou internas não-críticas. Harbor pra imagens que vão pra produção — porque Harbor tem:
- **Vulnerability scanning nativo** (Trivy integrado)
- **Assinatura de imagem com Notary** (você prova que a imagem não foi adulterada)
- **Políticas de retenção** (limpa imagens antigas automaticamente)
- **Replication** (espelha imagens entre datacenters)
- **RBAC** (quem pode push/pull em qual projeto)

E o Harbor roda no seu cluster — os dados não saem da sua infra. Pra compliance BACEN, isso é relevante.

### Métricas DORA na Prática

"As quatro métricas DORA não são métricas de vaidade. Elas são **leading indicators** de performance organizacional. Empresas que performam bem em DORA têm 2x mais lucratividade e 3x mais probabilidade de atingir metas de crescimento (fonte: State of DevOps Report 2023)."

No pipeline, você coleta essas métricas automaticamente:

```yaml
collect-dora-metrics:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy Frequency
      run: |
        DEPLOYS=$(gh api repos/$GITHUB_REPOSITORY/deployments \
          --jq '[.[] | select(.environment=="Production")] | length')
        echo "Deploy_frequency_last_30_days=$DEPLOYS" >> $GITHUB_STEP_SUMMARY

    - name: Lead Time for Changes
      run: |
        # Tempo entre primeiro commit do PR e deploy em produção
        FIRST_COMMIT=$(gh pr view $PR_NUMBER --json commits --jq '.commits[0].committedDate')
        DEPLOY_TIME=$(gh api repos/$GITHUB_REPOSITORY/deployments \
          --jq '.[0].created_at')
        # Calculate difference...

    - name: Change Failure Rate
      run: |
        TOTAL_DEPLOYS=$(gh api repos/$GITHUB_REPOSITORY/deployments \
          --jq '[.[] | select(.environment=="Production")] | length')
        FAILED_DEPLOYS=$(gh run list --workflow=cd-production --status=failure --json databaseId --jq 'length')
        echo "Change_failure_rate=$(echo "Scale=2; $FAILED_DEPLOYS / $TOTAL_DEPLOYS * 100" | bc)%" >> $GITHUB_STEP_SUMMARY

    - name: Mean Time to Recover (MTTR)
      run: |
        # Tempo entre rollback trigger e restore confirmado
        # Coletar dos logs de deployment...
```

**Por que essas 4 métricas especificamente?** Porque a pesquisa DORA (Nicole Forsgren, Jez Humble, Gene Kim) encontrou que essas 4 são as únicas que correlacionam com outcomes de negócio. Throughput (frequency + lead time) e Estabilidade (failure rate + MTTR). Você não precisa de 50 dashboards — precisa dessas 4.

**Por que MTTR < 1 hora?** Porque cada minuto de outage em sistema financeiro custa, em média, US$ 9.000 (fonte: Ponemon Institute 2022). Se seu MTTR é 4 horas, cada incidente custa US$ 36.000. Se você investe US$ 10.000 em automação de rollback pra reduzir MTTR pra 15 minutos, o ROI é de 1 incidente. Literalmente. Um único incidente paga a automação.

### GitOps — A Evolução Natural do CI/CD

"CI/CD automatiza o deploy. GitOps automatiza a **reconciliação**. No CI/CD tradicional, o pipeline empurra mudanças pros ambientes (`kubectl apply`). No GitOps, cada ambiente tem seu próprio repositório Git que declara o estado desejado. Um operador (ArgoCD, Flux) monitora esse repositório e reconcilia o cluster com o estado declarado."

```mermaid
flowchart LR
    subgraph "CI"
        PR[PR] --> BUILD[Build & Test]
        BUILD --> REGISTRY[Push Image]
        REGISTRY --> CONFIG_PR[Update Config Repo]
    end

    subgraph "GitOps"
        CONFIG_REPO[(Config Repo<br/>per environment)] --> ARGO[ArgoCD]
        ARGO -->|Reconcile| K8S[Kubernetes]
        K8S -->|Report Status| ARGO
        ARGO -->|Drift Detection| CONFIG_REPO
    end

    CONFIG_PR --> CONFIG_REPO
```

Vantagens do GitOps:
- **Pull-based**: O cluster puxa o estado desejado — não precisa expor o cluster pra internet.
- **Drift detection**: Se alguém fizer `kubectl edit` manual, o ArgoCD reverte em segundos.
- **Audit trail completo**: O Git é o audit log de todas as mudanças de infra.
- **Disaster recovery**: Se o cluster inteiro morrer, você sobe um cluster novo, aponta pro Git repo, e o ArgoCD reconstrói tudo.

Pra fintech, GitOps é o padrão ouro porque atende a exigência BACEN de 'rastreabilidade de alterações' sem esforço adicional — o Git já é o registro.

### Compliance Gates — Como Implementar na Prática

"Compliance não é um checklist que você preenche antes da auditoria. Compliance é um **conjunto de regras automatizadas** que barram código não-conforme antes de chegar em produção."

No pipeline, compliance gates são implementados como jobs com `fail-fast: true` que bloqueiam o deploy:

```yaml
compliance-gates:
  name: 🛡️ BACEN Compliance Gates
  runs-on: ubuntu-latest
  steps:
    - name: Gate 1 — Code Owners Approval
      run: |
        REVIEWERS=$(gh pr view ${{ github.event.pull_request.number }} --json reviews --jq '.reviews[].author.login' | sort -u)
        REQUIRED=$(cat .github/CODEOWNERS | grep -v '^#' | awk '{print $NF}' | sed 's/@//g' | sort -u)
        for required in $REQUIRED; do
          if ! echo "$REVIEWERS" | grep -q "$required"; then
            echo "❌ Missing required reviewer: @$required"
            exit 1
          fi
        done
        echo "✅ All required code owners approved"

    - name: Gate 2 — No Direct Push to Main
      run: |
        if [ "${{ github.ref }}" == "Refs/heads/main" ] && [ "${{ github.event_name }}" != "Pull_request" ]; then
          echo "❌ Direct push to main is not allowed"
          exit 1
        fi

    - name: Gate 3 — All CI Checks Passed
      run: |
        CHECKS=$(gh pr checks ${{ github.event.pull_request.number }} --json state --jq '[.[].state] | unique')
        if echo "$CHECKS" | grep -q "FAILURE"; then
          echo "❌ Some CI checks failed"
          exit 1
        fi

    - name: Gate 4 — No Sensitive Files Changed
      run: |
        SENSITIVE_FILES="K8s/production/secrets|.env.production|terraform/state"
        CHANGED=$(git diff --name-only origin/main...HEAD)
        if echo "$CHANGED" | grep -qE "$SENSITIVE_FILES"; then
          echo "⚠️  Sensitive files changed — manual review required"
          gh pr comment ${{ github.event.pull_request.number }} --body "⚠️ This PR changes sensitive files. Please review carefully."
        fi

    - name: Gate 5 — Test Coverage Threshold
      run: |
        COVERAGE=$(cat apps/ledger/coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "❌ Coverage ($COVERAGE%) below threshold (80%)"
          exit 1
        fi
```

Cada gate é um checkpoint. Se qualquer gate falhar, o deploy é bloqueado. O BACEN quer evidência de controle? Mostra os logs desse job. Cada gate é uma linha de defesa documentada.

---

## 🧪 Testando o Pipeline

"Testar pipeline é diferente de testar código. Você está testando um sistema distribuído que orquestra builds, scans, e deploys. O teste precisa cobrir o happy path e os cenários de falha."

### Teste 1 — Pipeline Completo com `act`

```bash
# Simular todo o pipeline localmente
act pull_request \
  --secret GITHUB_TOKEN="$(gh auth token)" \
  --container-architecture linux/amd64 \
  --artifact-server-path /tmp/artifacts

# Simular o workflow de produção
act push \
  --ref refs/heads/main \
  --secret GITHUB_TOKEN="$(gh auth token)"
```

### Teste 2 — SAST Scan Detecta Vulnerabilidade

```typescript
// Código com SQL injection intencional (apenas para teste)
const query = `SELECT * FROM accounts WHERE id = '${userInput}'`;

// O CodeQL deve detectar e falhar o pipeline
```

### Teste 3 — TruffleHog Detecta Secret Vazado

```bash
# Criar arquivo com secret falso
echo 'DATABASE_URL=postgres://user:my-secret-password@prod.example.com/db' > .env.test

# Rodar scan
docker run --rm -v $(pwd):/src ghcr.io/trufflesecurity/trufflehog:latest \
  filesystem /src --json --only-verified

# Deve retornar: "Found verified result: DATABASE_URL"
```

### Teste 4 — Rollback Automático

```bash
# Simular deploy com erro
kubectl apply -f k8s/production/ledger-green-faulty.yaml

# Simular erro no health check
curl -f http://green-ledger:8080/health || echo "Health check failed"

# Rollback automático (via pipeline)
kubectl patch svc ledger -n production \
  -p '{"Spec":{"Selector":{"App":"Ledger","Color":"Blue"}}}'

# Verificar que tráfego voltou pra Blue
kubectl get svc ledger -n production -o jsonpath='{.spec.selector.color}'
# Deve retornar: blue
```

### Teste 5 — Concorrência em Deploy

```bash
# Simular dois deploys simultâneos (não deve acontecer)
# O concurrency group no GitHub Actions garante que só um deploy roda por vez
gh workflow run cd-production.yml -f service=ledger &
gh workflow run cd-production.yml -f service=ledger &

# O segundo deve receber: "Waiting for concurrency group 'deploy-ledger'"
```

---

## 💡 Lições Aprendidas

1. **CI/CD não é ferramenta — é cultura.** Você pode ter o pipeline mais sofisticado do mundo, mas se o time ainda faz deploy manual 'quando dá problema', o pipeline é inútil. A ferramenta é 20%. Os 80% são: o time confia no pipeline, o time usa o pipeline pra cada deploy, o time mantém o pipeline como código de primeira classe.

2. **Cada deploy deve ser reversível em menos de 60 segundos.** Se você não consegue voltar atrás rápido, você não deveria estar deployando. Blue/Green ou rollback automático não é opcional — é exigência de engenharia. O custo de manter pods extras por 15 minutos é irrisório comparado ao custo de um incidente sem rollback.

3. **SAST + DAST + Dependency Scanning são obrigatórios, não opcionais.** Em fintech, você lida com dados financeiros e dados pessoais (LGPD). Uma vulnerabilidade explorada não é 'bug' — é 'incidente de segurança reportável ao BACEN e à ANPD'. O CodeQL + Semgrep + Trivy + TruffleHog custam zero dólares e rodam em segundos no pipeline. Não tem desculpa.

4. **Secrets nunca, jamais, em hipótese alguma, vão no código-fonte.** Secret em repositório Git é segredo público — mesmo que você delete o commit, o histórico do Git preserva tudo. Use GitHub Secrets, Vault, Sealed Secrets, ou qualquer gerenciador de secrets. Mas não hardcode. Um `trufflehog` no CI pega antes do merge.

5. **Database migrations precisam ser testadas em staging com dados realistas.** Staging não é ambiente de teste com 10 registros — é um espelho anonimizado de produção. Se sua migration trava em staging, você conserta antes de chegar em produção. `pgroll` e `gh-ost` permitem migrações sem downtime. Use-os.

6. **Canary não é luxo — é seguro.** Subir 5% de tráfego, observar, subir 25%, observar, subir 100%. Se quebrou nos 5%, só 5% dos usuários sentiram. Rollback automático. Sem canary, 100% dos usuários sentem o bug ao mesmo tempo.

7. **Métricas DORA não são vaidade — são diagnóstico.** Se deploy frequency é baixa, seu pipeline é lento ou seu time tem medo de deploy. Se lead time é alto, seu code review é gargalo. Se change failure rate é alto, seus testes são insuficientes. Se MTTR é alto, seu rollback não é automatizado. As métricas te dizem **onde melhorar**.

8. **O pipeline é código — trate como tal.** O arquivo `.github/workflows/ci.yml` deve passar por code review como qualquer outro código. Refatore ações repetitivas em composite actions. Mantenha o pipeline versionado, testado, e com changelog. Se o pipeline quebrar, é incidente como qualquer outro.

9. **Multi-arch builds são obrigatórias em 2026.** ARM64 (Graviton, Apple Silicon) já é maioria em cloud. Buildar só `linux/amd64` significa que você está rodando com emulação em ARM — mais lento, mais caro. `docker buildx build --platform linux/amd64,linux/arm64` resolve.

10. **GitOps é o destino final.** CI/CD automatiza o push. GitOps automatiza a reconciliação. Com ArgoCD, o estado do seu cluster é declarado em Git. Se alguém fizer uma alteração manual, o ArgoCD reverte. Se o cluster morrer, você reconstrói do Git. Isso é o padrão ouro de rastreabilidade.

---

## 🚀 Como Testar na Prática

```bash
# 1. Simular CI completo localmente
act pull_request \
  --secret GITHUB_TOKEN="$(gh auth token)" \
  --container-architecture linux/amd64

# 2. Build manual dos serviços com cache
docker buildx build \
  --cache-from type=gha,scope=ledger \
  --cache-to type=gha,scope=ledger \
  -t banking/ledger:test \
  -f apps/ledger/Dockerfile .

# 3. Scan de vulnerabilidades na imagem
trivy image banking/ledger:test --severity HIGH,CRITICAL

# 4. Scan de secrets no código
trufflehog filesystem . --json --only-verified

# 5. Scan de dependências
pnpm audit --audit-level=high

# 6. Deploy manual em staging
kubectl set image deployment/ledger \
  ledger=ghcr.io/banking/ledger:test \
  --namespace=staging
kubectl rollout status deployment/ledger \
  --namespace=staging --timeout=5m

# 7. Health check pós-deploy
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://staging-api.banking.com.br/health)
  if [ "$STATUS" == "200" ]; then
    echo "✅ Staging healthy ($(curl -s https://staging-api.banking.com.br/health | jq -r '.uptime'))"
    break
  fi
  sleep 2
done

# 8. Simular switch Blue/Green
CURRENT=$(kubectl get svc ledger -n production -o jsonpath='{.spec.selector.color}')
NEXT=$([ "$CURRENT" == "Blue" ] && echo "Green" || echo "Blue")
kubectl patch svc ledger -n production \
  -p "{\"Spec\":{\"Selector\":{\"App\":\"Ledger\",\"Color\":\"$NEXT\"}}}"

# 9. Rollback instantâneo
PREVIOUS=$CURRENT
kubectl patch svc ledger -n production \
  -p "{\"Spec\":{\"Selector\":{\"App\":\"Ledger\",\"Color\":\"$PREVIOUS\"}}}"

# 10. Validar compliance gates
gh pr checks 123 --json state,name --jq '.[] | "\(.name): \(.state)"'

# 11. Gerar SBOM
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# 12. Verificar métricas DORA
gh api repos/$GITHUB_REPOSITORY/deployments?environment=production \
  --jq 'length'  # Deploy frequency (last 30 days)
```

---

## 🔧 Troubleshooting

### 1. Docker build falha com `no space left on device`

**Causa:** GitHub Actions runners têm 14GB de espaço em disco. Imagens grandes + cache excedem o limite.

**Solução:**
```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet /usr/local/lib/android /opt/ghc
    sudo docker image prune -af
    df -h
```

### 2. `pnpm install --frozen-lockfile` falha com `ERR_PNPM_OUTDATED_LOCKFILE`

**Causa:** Alguém modificou `package.json` sem rodar `pnpm install` pra atualizar o lockfile.

**Solução:**
```yaml
- name: Verify lockfile
  run: |
    pnpm install --frozen-lockfile
    if [ $? -ne 0 ]; then
      echo "❌ Lockfile is outdated. Run 'pnpm install' locally and commit pnpm-lock.yaml"
      exit 1
    fi
```

### 3. CodeQL reporta `js/sql-injection` — mas é falso positivo

**Causa:** CodeQL não consegue rastrear que o input foi sanitizado por uma função de escape personalizada.

**Solução:** Adicionar anotação de sanitizer:
```javascript
/**
 * @param {string} value
 * @returns {string}
 * @sanitizer sqlEscape
 */
function sanitizeForSQL(value: string): string {
  return value.replace(/['";\\]/g, '\\$&');
}
```

### 4. Rollback não funciona — pods Blue foram removidos

**Causa:** O job de cleanup rodou cedo demais e matou os pods antigos antes do período de observação.

**Solução:**
```yaml
- name: Keep old pods for rollback window
  run: |
    kubectl scale deployment/$APP-blue --replicas=2 -n production
    # Wait full canary observation period + buffer
    sleep 1200  # 20 minutes
    kubectl scale deployment/$APP-blue --replicas=0 -n production
```

### 5. Trivy reporta CVE em biblioteca que não está na imagem final

**Causa:** Trivy scaneia a imagem inteira. O multi-stage build pode ter deixado artefatos de build.

**Solução:** Verificar se a biblioteca está realmente na imagem final:
```bash
docker run --rm ghcr.io/banking/ledger:$SHA sh -c "Find / -name '*vulnerable-lib*' 2>/dev/null"
```
Se não estiver, adicionar ao `.trivyignore`:
```
# False positive: library only in build stage
CVE-2024-12345
```

### 6. Canary release não consegue consultar Prometheus

**Causa:** Prometheus não está acessível do GitHub Actions runner (rede).

**Solução:** Usar um self-hosted runner dentro da mesma VPC do cluster:
```yaml
runs-on: [self-hosted, linux, x64, production-vpc]
```

Ou expor métricas via GitHub Actions Service:
```yaml
services:
  prometheus-proxy:
    image: nginx
    ports: ['9090:9090']
```

### 7. `act` falha com `Error: failed to connect to docker`

**Causa:** Docker socket não está disponível ou permissões incorretas.

**Solução:**
```bash
# Verificar Docker
docker ps

# Rodar act com socket explícito
act -P ubuntu-latest=-self-hosted \
  --container-daemon-socket /var/run/docker.sock
```

---

## 📚 O que vem depois

- **ArgoCD com Auto-Sync** — GitOps pull-based com reconciliação contínua. O repositório de config é a fonte da verdade. Drift detection automático reverte alterações manuais em minutos.

- **Feature Flags com LaunchDarkly/Unleash** — Separe deploy de release. Deploye código em produção com a feature desligada, e ative via flag quando estiver pronto. Rollback de feature vira um toggle.

- **Chaos Engineering com Litmus/Gremlin** — Teste a resiliência do seu pipeline: e se o registry cair? E se o cluster perder um node durante o canary? E se a rede do datacenter oscilar? Teste em staging.

- **k6 Performance Testing** — Testes de carga automatizados no pipeline. 1000 VUs, 10 minutos, comparar p95 com baseline. Regressão de performance bloqueia deploy.

- **Open Policy Agent (OPA) + Gatekeeper** — Políticas de compliance como código: "Nenhum pod pode rodar como root", "Toda imagem deve vir de um registry aprovado", "Todo namespace de produção precisa de NetworkPolicy".

- **SBOM Pipeline Completo** — Gerar Software Bill of Materials em CycloneDX, assinar com cosign, publicar no Dependency Track pra monitoramento contínuo de vulnerabilidades.

- **Progressive Delivery com Argo Rollouts** — Evolução do canary: análise de métricas automatizada, promoção condicional, rollback baseado em SLOs.

- **Value Stream Management** — Dashboard unificado de métricas DORA, fluxo de valor, e lead time por squad. Conecte o commit ao deploy ao impacto no negócio.

- **HashiCorp Vault Dynamic Secrets** — Credenciais de banco de dados com TTL de 1 hora, geradas sob demanda, revogadas automaticamente. Nenhuma credencial estática em config nenhum.

<div class="Lang-content go" style="Display:none;">

### Go CI/CD com GoReleaser e Ko

Para serviços Go no monorepo, o pipeline se integra com ferramentas nativas do ecossistema:

```yaml
build-go:
  name: 🐹 Build & Release Go (${{ matrix.service }})
  runs-on: ubuntu-latest
  strategy:
    matrix:
      service: [ledger, dict]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-go@v5
      with: { go-version: '1.22' }

    - name: GoReleaser (dry-run on PR)
      if: github.event_name == 'pull_request'
      uses: goreleaser/goreleaser-action@v5
      with:
        args: release --snapshot --clean --skip-publish
        workdir: apps/${{ matrix.service }}

    - name: GoReleaser (publish on tag)
      if: startsWith(github.ref, 'refs/tags/')
      uses: goreleaser/goreleaser-action@v5
      with:
        args: release --clean
        workdir: apps/${{ matrix.service }}
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Build container with ko
      uses: ko-build/setup-ko@v0.6
    - run: ko build --bare --platform=linux/amd64,linux/arm64 \
        --tags latest,${{ github.sha }} \
        ./apps/${{ matrix.service }}/cmd/${{ matrix.service }}
```

```yaml
# .goreleaser.yaml
builds:
  - main: ./cmd/ledger
    goos: [linux]
    goarch: [amd64, arm64]
    env: [CGO_ENABLED=0]
    ldflags:
      - -s -w -X main.version={{.Version}} -X main.commit={{.Commit}}
    mod_timestamp: '{{ .CommitTimestamp }}'
    flags: [-trimpath]

dockers:
  - image_templates:
      - 'ghcr.io/banking/ledger:{{ .Version }}-amd64'
    use: buildx
    build_flag_templates:
      - --platform=linux/amd64
      - --label=org.opencontainers.image.version={{.Version}}
      - --label=org.opencontainers.image.revision={{.FullCommit}}
  - image_templates:
      - 'ghcr.io/banking/ledger:{{ .Version }}-arm64'
    use: buildx
    build_flag_templates:
      - --platform=linux/arm64
      - --label=org.opencontainers.image.version={{.Version}}

docker_manifests:
  - name_template: 'ghcr.io/banking/ledger:{{ .Version }}'
    image_templates:
      - 'ghcr.io/banking/ledger:{{ .Version }}-amd64'
      - 'ghcr.io/banking/ledger:{{ .Version }}-arm64'
  - name_template: 'ghcr.io/banking/ledger:latest'
    image_templates:
      - 'ghcr.io/banking/ledger:{{ .Version }}-amd64'
      - 'ghcr.io/banking/ledger:{{ .Version }}-arm64'

archives:
  - format: binary
    name_template: '{{ .ProjectName }}_{{ .Os }}_{{ .Arch }}'

checksum:
  name_template: 'checksums.txt'

changelog:
  sort: asc
  filters:
    exclude:
      - '^docs:'
      - '^test:'
      - '^ci:'
      - Merge pull request
```

O GoReleaser faz o que você faria manualmente: cross-compila, gera checksums, builda imagens Docker multi-arch, cria manifest lists, e publica release no GitHub — tudo com um comando. E o `ko` builda imagens Go diretamente, sem Dockerfile. Ele detecta o `go.mod`, compila, e empacota em container com `FROM scratch` automaticamente.

<Quiz />

<GiscusComments />

</div>
