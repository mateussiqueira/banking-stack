#!/usr/bin/env bash
set -euo pipefail

# Banking Tekton Setup
# Installs Tekton Pipelines, Triggers, and Dashboard on a Kubernetes cluster

TEKTON_VERSION="${TEKTON_VERSION:-v0.58.0}"
TRIGGERS_VERSION="${TRIGGERS_VERSION:-v0.27.0}"
DASHBOARD_VERSION="${DASHBOARD_VERSION:-v0.47.0}"
NAMESPACE="${NAMESPACE:-cicd}"

echo "========================================"
echo " Banking Tekton CI/CD Setup"
echo "========================================"
echo ""

preflight_checks() {
  echo "[1/6] Preflight checks..."

  if ! command -v kubectl &>/dev/null; then
    echo "ERROR: kubectl not found. Install it first:"
    echo "  https://kubernetes.io/docs/tasks/tools/"
    exit 1
  fi

  if ! kubectl cluster-info &>/dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
  fi

  echo "  Cluster: $(kubectl cluster-info --request-timeout=5s 2>&1 | head -1)"
  echo "  Client:  $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
  echo ""
}

install_tekton_pipelines() {
  echo "[2/6] Installing Tekton Pipelines ($TEKTON_VERSION)..."
  kubectl apply -f \
    "https://storage.googleapis.com/tekton-releases/pipeline/previous/${TEKTON_VERSION}/release.yaml"

  echo "  Waiting for Tekton Pipelines to be ready..."
  kubectl wait --for=condition=Ready pods --all \
    -n tekton-pipelines --timeout=120s
  echo ""
}

install_tekton_triggers() {
  echo "[3/6] Installing Tekton Triggers ($TRIGGERS_VERSION)..."
  kubectl apply -f \
    "https://storage.googleapis.com/tekton-releases/triggers/previous/${TRIGGERS_VERSION}/release.yaml"

  kubectl apply -f \
    "https://storage.googleapis.com/tekton-releases/triggers/previous/${TRIGGERS_VERSION}/interceptors.yaml"

  echo "  Waiting for Tekton Triggers to be ready..."
  kubectl wait --for=condition=Ready pods --all \
    -n tekton-pipelines --timeout=120s
  echo ""
}

install_tekton_dashboard() {
  echo "[4/6] Installing Tekton Dashboard ($DASHBOARD_VERSION)..."
  kubectl apply -f \
    "https://storage.googleapis.com/tekton-releases/dashboard/previous/${DASHBOARD_VERSION}/release-full.yaml"

  echo "  Waiting for Tekton Dashboard to be ready..."
  kubectl wait --for=condition=Ready pods --all \
    -n tekton-pipelines --timeout=120s
  echo ""
}

create_namespace() {
  echo "[5/6] Creating CI/CD namespace ($NAMESPACE)..."
  kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

  kubectl label namespace "$NAMESPACE" \
    name="$NAMESPACE" \
    app.kubernetes.io/part-of=banking \
    tekton=enabled --overwrite

  echo ""
}

apply_tekton_resources() {
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

  echo "[6/6] Applying Tekton resources from $SCRIPT_DIR..."

  kubectl apply -f "$SCRIPT_DIR/tekton/tasks/" -n "$NAMESPACE"
  kubectl apply -f "$SCRIPT_DIR/tekton/pipelines/" -n "$NAMESPACE"
  kubectl apply -f "$SCRIPT_DIR/tekton/triggers/" -n "$NAMESPACE"

  echo ""
}

summary() {
  echo "========================================"
  echo " Setup Complete!"
  echo "========================================"
  echo ""
  echo "Tekton Pipelines:  $TEKTON_VERSION"
  echo "Tekton Triggers:   $TRIGGERS_VERSION"
  echo "Tekton Dashboard:  $DASHBOARD_VERSION"
  echo "Namespace:         $NAMESPACE"
  echo ""
  echo "Access Dashboard:"
  echo "  kubectl proxy"
  echo "  http://localhost:8001/api/v1/namespaces/tekton-pipelines/services/tekton-dashboard:http/proxy/"
  echo ""
  echo "Verify installation:"
  echo "  kubectl get pods -n tekton-pipelines"
  echo "  kubectl get pods -n $NAMESPACE"
  echo ""
  echo "Next steps:"
  echo "  1. Create the GitHub webhook secret:"
  echo "     bash scripts/create-github-secret.sh"
  echo "  2. Add the webhook URL to GitHub:"
  echo "     https://github.com/banking/banking-app/settings/hooks"
  echo ""
}

preflight_checks
install_tekton_pipelines
install_tekton_triggers
install_tekton_dashboard
create_namespace
apply_tekton_resources
summary
