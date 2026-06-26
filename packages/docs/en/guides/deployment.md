# Deployment Guide

How to deploy banking-stack to production.

## Option 1: VPS with Docker

### Requirements

- Ubuntu 22.04+
- Docker 24+
- Docker Compose v2
- 4GB RAM minimum

### Setup

```bash
# On server
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack

# Configure environment
cp .env.example .env
nano .env  # adjust passwords and config

# Start infrastructure
docker compose -f docker-compose.yml up -d

# Build services
docker compose -f docker-compose.production.yml build

# Run
docker compose -f docker-compose.production.yml up -d
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Option 2: Kubernetes

### Manifests

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spi-simulator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spi-simulator
  template:
    metadata:
      labels:
        app: spi-simulator
    spec:
      containers:
      - name: spi
        image: banking-stack/spi-simulator:latest
        ports:
        - containerPort: 3002
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

### Exposure

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spi-simulator
spec:
  selector:
    app: spi-simulator
  ports:
  - port: 80
    targetPort: 3002
  type: LoadBalancer
```

---

## Option 3: Vercel (Frontend)

```bash
# Landing Page
cd packages/frontend/landing-page
vercel --prod

# Docs
cd packages/docs
vercel --prod
```

---

## Monitoring

### Health Checks

```bash
# All services
for port in 3002 3003 3004 3005 3006 3007 3008 3009; do
  curl -s http://localhost:$port/health | jq .status
done
```

### Logs

```bash
# Docker
docker compose logs -f spi-simulator

# Kubernetes
kubectl logs -f deployment/spi-simulator
```

### Metrics

- CPU usage
- Memory usage
- Request latency (p50, p95, p99)
- Error rate
- Throughput (req/s)
