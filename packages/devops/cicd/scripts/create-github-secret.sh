#!/usr/bin/env bash
set -euo pipefail

# Banking GitHub Webhook Secret Setup
# Creates the Kubernetes secret for GitHub webhook validation

NAMESPACE="${NAMESPACE:-cicd}"
SECRET_NAME="${SECRET_NAME:-github-webhook-secret}"

echo "========================================"
echo " GitHub Webhook Secret Setup"
echo "========================================"
echo ""

WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"
if [ -z "$WEBHOOK_SECRET" ]; then
  echo "Generating random webhook secret..."
  WEBHOOK_SECRET=$(openssl rand -hex 32)
  echo "  Generated: $WEBHOOK_SECRET"
fi

echo ""
echo "Target namespace: $NAMESPACE"
echo ""

kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --from-literal=secretToken="$WEBHOOK_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret '$SECRET_NAME' created in namespace '$NAMESPACE'"
echo ""

echo "========================================"
echo " Next Steps"
echo "========================================"
echo ""
echo "1. Add this secret to your GitHub repository:"
echo "   https://github.com/banking/banking-app/settings/hooks"
echo ""
echo "   Payload URL:  https://webhook.banking.internal/github"
echo "   Content type: application/json"
echo "   Secret:       $WEBHOOK_SECRET"
echo "   Events:       Push, Pull request, Tag creation"
echo ""
echo "2. Verify the webhook is delivering:"
echo "   kubectl get events -n $NAMESPACE --watch"
echo ""
echo "3. Expose the EventListener (if not already):"
echo "   kubectl port-forward -n $NAMESPACE \\"
echo "     service/el-github-event-listener 8080:8080"
echo ""

# Save secret to a file for reference (optional)
SAVE_TO_FILE="${SAVE_TO_FILE:-}"
if [ -n "$SAVE_TO_FILE" ]; then
  echo "$WEBHOOK_SECRET" > "$SAVE_TO_FILE"
  chmod 600 "$SAVE_TO_FILE"
  echo "Secret saved to: $SAVE_TO_FILE"
fi
