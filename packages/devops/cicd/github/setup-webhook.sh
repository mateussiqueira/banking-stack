#!/bin/bash
set -euo pipefail

# setup-webhook.sh
# Configura webhook do GitHub apontando para o EventListener do Tekton.
#
# Pré-requisitos:
#   - gh CLI instalado e autenticado (gh auth login)
#   - kubectl configurado com acesso ao cluster
#   - Tekton Triggers instalado no cluster
#
# Uso:
#   bash github/setup-webhook.sh [repo] [webhook-url]
#
# Exemplos:
#   bash github/setup-webhook.sh
#   bash github/setup-webhook.sh banking/banking-app https://tekton-webhook.banking.com

GITHUB_REPO="${1:-}"
WEBHOOK_URL="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_prerequisites() {
  if ! command -v gh &>/dev/null; then
    log_error "gh CLI not found. Install from https://cli.github.com/"
    exit 1
  fi

  if ! command -v kubectl &>/dev/null; then
    log_error "kubectl not found"
    exit 1
  fi

  if ! gh auth status &>/dev/null; then
    log_error "Not authenticated with GitHub. Run 'gh auth login'"
    exit 1
  fi

  log_info "Prerequisites satisfied"
}

get_or_input_repo() {
  if [ -z "$GITHUB_REPO" ]; then
    GITHUB_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)
    if [ -z "$GITHUB_REPO" ]; then
      read -rp "GitHub repository (owner/repo): " GITHUB_REPO
    fi
  fi

  if ! gh repo view "$GITHUB_REPO" &>/dev/null; then
    log_error "Repository $GITHUB_REPO not found or not accessible"
    exit 1
  fi

  log_info "Using repository: $GITHUB_REPO"
}

get_or_input_webhook_url() {
  if [ -z "$WEBHOOK_URL" ]; then
    WEBHOOK_URL=$(kubectl get ingress -n cicd tekton-webhook \
      -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || true)

    if [ -z "$WEBHOOK_URL" ]; then
      WEBHOOK_URL=$(kubectl get svc -n cicd el-github-event-listener \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
    fi

    if [ -z "$WEBHOOK_URL" ]; then
      read -rp "Webhook URL (e.g., https://tekton-webhook.banking.com): " WEBHOOK_URL
    fi
  fi

  log_info "Using webhook URL: $WEBHOOK_URL"
}

generate_and_setup_secret() {
  WEBHOOK_SECRET=$(openssl rand -hex 32)
  log_info "Generated webhook secret: $WEBHOOK_SECRET"

  kubectl create secret generic github-webhook-secret \
    --namespace=cicd \
    --from-literal=secretToken="$WEBHOOK_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -
  log_info "Secret 'github-webhook-secret' created in namespace 'cicd'"

  echo "$WEBHOOK_SECRET"
}

generate_ssh_deploy_key() {
  SSH_KEY_PATH="/tmp/banking-deploy-key-$(date +%s)"
  ssh-keygen -t ed25519 -C "tekton@banking.com" -f "$SSH_KEY_PATH" -N "" -q
  log_info "SSH deploy key generated at $SSH_KEY_PATH"

  gh repo deploy-key add "$SSH_KEY_PATH.pub" \
    --repo "$GITHUB_REPO" \
    --title "Tekton CI/CD Deploy Key" \
    --allow-write

  log_info "Deploy key added to $GITHUB_REPO"

  kubectl create secret generic github-ssh-key \
    --namespace=cicd \
    --from-file=id_ed25519="$SSH_KEY_PATH" \
    --from-file=id_ed25519.pub="$SSH_KEY_PATH.pub" \
    --dry-run=client -o yaml | kubectl apply -f -

  rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
  log_info "SSH key stored in Kubernetes secret 'github-ssh-key'"
}

create_github_webhook() {
  WEBHOOK_SECRET="$1"
  WEBHOOK_ENDPOINT="${WEBHOOK_URL%/}/"

  EXISTING_WEBHOOK=$(gh api "/repos/$GITHUB_REPO/hooks" \
    --jq ".[] | select(.config.url == \"$WEBHOOK_ENDPOINT\") | .id")

  if [ -n "$EXISTING_WEBHOOK" ]; then
    log_info "Webhook already exists (ID: $EXISTING_WEBHOOK), updating..."
    gh api "repos/$GITHUB_REPO/hooks/$EXISTING_WEBHOOK" \
      --method PATCH \
      --field config[url]="$WEBHOOK_ENDPOINT" \
      --field config[content_type]="json" \
      --field config[secret]="$WEBHOOK_SECRET" \
      --field config[insecure_ssl]="0" \
      --field events[]="push" \
      --field events[]="pull_request" \
      --field events[]="release" \
      -q '.id' >/dev/null
  else
    log_info "Creating new webhook..."
    gh api "repos/$GITHUB_REPO/hooks" \
      --method POST \
      --field name="web" \
      --field active=true \
      --field config[url]="$WEBHOOK_ENDPOINT" \
      --field config[content_type]="json" \
      --field config[secret]="$WEBHOOK_SECRET" \
      --field config[insecure_ssl]="0" \
      --field events[]="push" \
      --field events[]="pull_request" \
      --field events[]="release" \
      -q '.id' >/dev/null
  fi

  log_info "Webhook configured for $GITHUB_REPO"
}

test_webhook() {
  log_info "Testing webhook with a ping event..."
  gh api "repos/$GITHUB_REPO/hooks/$(gh api "repos/$GITHUB_REPO/hooks" --jq '.[0].id')/tests" \
    --method POST >/dev/null 2>&1 || true
  log_info "Ping sent. Check Tekton EventListener logs:"
  echo "  kubectl logs -n cicd -l app.kubernetes.io/name=tekton-triggers --tail=20"
}

main() {
  echo "============================================"
  echo " GitHub Webhook Setup for Tekton CI/CD"
  echo "============================================"
  echo ""

  check_prerequisites
  get_or_input_repo
  get_or_input_webhook_url

  echo ""
  echo "--- Step 1: Generating webhook secret ---"
  WEBHOOK_SECRET=$(generate_and_setup_secret)

  echo ""
  echo "--- Step 2: Setting up SSH deploy key ---"
  generate_ssh_deploy_key

  echo ""
  echo "--- Step 3: Creating GitHub webhook ---"
  create_github_webhook "$WEBHOOK_SECRET"

  echo ""
  echo "--- Step 4: Testing webhook ---"
  test_webhook

  echo ""
  echo "============================================"
  echo " Setup Complete!"
  echo "============================================"
  echo ""
  echo " Repository:   $GITHUB_REPO"
  echo " Webhook URL:  $WEBHOOK_URL"
  echo " Events:       push, pull_request, release"
  echo ""
  echo " Next steps:"
  echo "   1. Push a commit to main to trigger the pipeline"
  echo "   2. Monitor pipelines: kubectl get pipelineruns -n cicd"
  echo "   3. View Tekton Dashboard: https://tekton.banking.com"
  echo ""
}

main "$@"
