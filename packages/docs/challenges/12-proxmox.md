# 12 — DevOps Proxmox

**🇧🇷** Infraestrutura com Proxmox VE  
**🇬🇧** Proxmox VE Infrastructure

---

## 🇧🇷 Descrição do Desafio

Implementar e configurar um ambiente de virtualização utilizando Proxmox VE para hospedar os serviços do Banking Challenges. O desafio abrange desde a instalação do hypervisor até a configuração de containers LXC e VMs com Docker.

Requisitos:
- Instalação e configuração do Proxmox VE
- Criação de containers LXC
- Criação de VMs Linux
- Configuração de rede (bridged, NAT)
- Backup e snapshot
- Monitoramento de recursos
- Automação com API Proxmox

---

## 🇬🇧 Challenge Description

Implement and configure a virtualization environment using Proxmox VE to host Banking Challenges services. The challenge covers from hypervisor installation to LXC containers and Docker VMs configuration.

Requirements:
- Proxmox VE installation and setup
- LXC container creation
- Linux VM creation
- Network configuration (bridged, NAT)
- Backup and snapshot
- Resource monitoring
- Proxmox API automation

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Proxmox VE Host                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VM 1: Docker Host                                    │   │
│  │  ├── Ledger Container                                 │   │
│  │  ├── SPI Simulator Container                          │   │
│  │  ├── MongoDB Container                                │   │
│  │  ├── Redis Container                                  │   │
│  │  └── PostgreSQL Container                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VM 2: Application Server                             │   │
│  │  ├── Frontend (Next.js)                               │   │
│  │  ├── Frontend (KYC)                                   │   │
│  │  └── Nginx Reverse Proxy                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LXC Container: CI/CD Runner                         │   │
│  │  ├── GitHub Actions Runner                            │   │
│  │  └── Docker-in-Docker                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Proxmox VE** | Hypervisor/management |
| **LXC** | Lightweight containers |
| **Docker** | Application containers |
| **Nginx** | Reverse proxy |
| **pve-api** | Proxmox automation |

## How to Run (Proposed)

```bash
# Proxmox API automation (conceptual)
pvesh create /nodes/proxmox1/qemu \
  --vmid 100 \
  --memory 4096 \
  --cores 4 \
  --storage local-zfs \
  --disk 32
```
