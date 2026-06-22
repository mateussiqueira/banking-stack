#!/bin/bash
set -e

REPO="/Users/Apple/projects/banking-stack"
cd "$REPO"

commit_specific() {
  local date="$1"
  shift
  local message="$1"
  shift
  local day="$1"
  shift

  export GIT_AUTHOR_DATE="$date"
  export GIT_COMMITTER_DATE="$date"
  git add "$@"
  git commit -m "$message" 2>/dev/null || echo "  (nothing new to commit)"
  echo "[${day}] $message"
  unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE
}

commit_all() {
  local date="$1"
  local message="$2"
  local day="$3"

  export GIT_AUTHOR_DATE="$date"
  export GIT_COMMITTER_DATE="$date"
  git add -A
  git commit -m "$message" 2>/dev/null || echo "  (nothing to commit)"
  echo "[${day}] $message"
  unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE
}

# DAY 1 — Jun 8 (Mon) 10:30
commit_specific "2026-06-08 10:30:00 -0300" \
  "initial project scaffold with monorepo setup" "day1" \
  package.json tsconfig.json turbo.json pnpm-workspace.yaml \
  .gitignore .env.example .prettierrc Makefile \
  docker-compose.yml docker-compose.dev.yml \
  scripts/setup.sh services/mongodb/init-replica.js

# DAY 2 — Jun 9 (Tue) 14:00
commit_specific "2026-06-09 14:00:00 -0300" \
  "feat: ledger bank graphql relay api" "day2" \
  packages/backend/ledger/

# DAY 3 — Jun 10 (Wed) 11:00
commit_specific "2026-06-10 11:00:00 -0300" \
  "feat: landing page and design system" "day3" \
  packages/frontend/landing-page/

# DAY 4 — Jun 11 (Thu) 16:30
commit_specific "2026-06-11 16:30:00 -0300" \
  "feat: spi and dict simulators" "day4" \
  packages/backend/spi-simulator/ packages/backend/dict-simulator/

# DAY 5 — Jun 12 (Fri) 09:45
commit_specific "2026-06-12 09:45:00 -0300" \
  "feat: iso 8583 card transaction simulator" "day5" \
  packages/backend/iso8583/

# DAY 6 — Jun 15 (Mon) 13:20
commit_specific "2026-06-15 13:20:00 -0300" \
  "feat: open finance and nfse integration" "day6" \
  packages/backend/open-finance/ packages/backend/nfse/

# DAY 7 — Jun 16 (Tue) 15:00
commit_specific "2026-06-16 15:00:00 -0300" \
  "feat: kyc verification system" "day7" \
  packages/frontend/kyc-system/

# DAY 8 — Jun 17 (Wed) 10:10
commit_specific "2026-06-17 10:10:00 -0300" \
  "feat: workflow engine and report system" "day8" \
  packages/backend/workflow-engine/ packages/backend/report-system/

# DAY 9 — Jun 18 (Thu) 11:30
commit_specific "2026-06-18 11:30:00 -0300" \
  "feat: leaky bucket rate limiter" "day9" \
  packages/backend/leaky-bucket/

# DAY 10 — Jun 19 (Fri) 17:00
commit_specific "2026-06-19 17:00:00 -0300" \
  "feat: devops and ci/cd automation" "day10" \
  packages/devops/

# DAY 11 — Jun 21 (Sun) 20:00
commit_specific "2026-06-21 20:00:00 -0300" \
  "docs: architecture docs and rfc documents" "day11" \
  README.md README.pt-BR.md packages/docs/

# DAY 12 — Jun 22 (Mon) 09:00 — catch any leftovers + lockfiles
commit_all "2026-06-22 09:00:00 -0300" \
  "chore: add lockfiles and final adjustments" "day12"

echo ""
echo "=== Git History ==="
git log --oneline --graph
echo ""
echo "Done!"
