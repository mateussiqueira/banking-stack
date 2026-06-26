# Challenge 12 — DevOps Proxmox

**What is it:** Infrastructure automation for Proxmox VE with Kubernetes.

**Why it matters:** Financial systems need reliable infrastructure. Proxmox provides the foundation.

## The stack

- **Proxmox VE** — hypervisor for VMs and containers
- **MicroK8s** — lightweight Kubernetes
- **Ansible** — configuration automation
- **Terraform** — infrastructure as code

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Proxmox Cluster                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Node 1      │  │  Node 2      │  │  Node 3      │     │
│  │  (Master)    │  │  (Worker)    │  │  (Worker)    │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │  K8s Master  │  │  K8s Worker  │  │  K8s Worker  │     │
│  │  DB Primary  │  │  DB Replica  │  │  DB Replica  │     │
│  │  Redis       │  │  Redis       │  │  Redis       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key decisions

1. **MicroK8s over kubeadm** — simpler setup, built-in addons
2. **PostgreSQL replication** — 3-node cluster for HA
3. **Redis sentinel** — automatic failover
4. **Ansible for config** — idempotent, repeatable
