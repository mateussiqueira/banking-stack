# Banking Proxmox + K8s Infrastructure

Infrastructure-as-code for bare-metal Proxmox virtualization, HA Kubernetes with MicroK8s, and managed database clusters.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / BGP                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Proxmox VE Cluster (3 nodes)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ proxmox-     │  │ proxmox-     │  │ proxmox-     │        │
│  │ master       │  │ node-1       │  │ node-2       │        │
│  │ 10.0.10.10   │  │ 10.0.10.11   │  │ 10.0.10.12   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                   │
│                    ┌──────▼──────┐                           │
│                    │  vmbr0      │                           │
│                    │  (bridge)   │                           │
│                    └──────┬──────┘                           │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼───────┐  ┌───────▼────────┐
│  K8s Network  │  │  DB Network    │  │  Storage       │
│  10.0.20.0/24 │  │  10.0.30.0/24 │  │  Ceph/Gluster  │
│               │  │               │  │                │
│ ┌───────────┐ │  │ ┌───────────┐ │  │  NFS / iSCSI   │
│ │ MicroK8s  │ │  │ │ES Cluster │ │  │                │
│ │ HA        │ │  │ │3 nodes    │ │  └────────────────┘
│ │3+ nodes   │ │  │ └───────────┘ │
│ │           │ │  │ ┌───────────┐ │
│ │ MetalLB   │ │  │ │Redis      │ │
│ │ 10.0.20.  │ │  │ │Sentinel/  │ │
│ │ 100-200   │ │  │ │Cluster    │ │
│ └───────────┘ │  │ └───────────┘ │
│               │  │ ┌───────────┐ │
│ ┌───────────┐ │  │ │MongoDB    │ │
│ │Monitoring │ │  │ │Replica Set│ │
│ │Stack      │ │  │ │3 nodes    │ │
│ └───────────┘ │  │ └───────────┘ │
└───────────────┘  └───────────────┘
```

## Prerequisites

- 3 bare-metal or virtual machines with Debian 12 installed
- Ansible >= 2.14
- SSH key-based access to all nodes
- At least 32GB RAM per Proxmox node
- Static IPs for all interfaces

## Usage

### 1. Proxmox Cluster Setup

```bash
ansible-playbook -i ansible/inventory.yml ansible/playbooks/proxmox-setup.yml
```

This will:
- Install Proxmox VE on all 3 nodes
- Configure bridge networking (vmbr0) with VLAN support
- Initialize the cluster on proxmox-master
- Join node-1 and node-2 to the cluster
- Create Ubuntu 24.04 VM template (ID: 9000)

### 2. Kubernetes Cluster

```bash
ansible-playbook -i ansible/inventory.yml ansible/playbooks/k8s-cluster.yml
```

Deploys MicroK8s with:
- HA control-plane with automatic replication
- MetalLB load balancer (10.0.20.100-200)
- K8s Dashboard
- NGINX Ingress Controller
- Hostpath Storage
- Container Registry
- DNS and CoreDNS

### 3. Database Clusters

```bash
ansible-playbook -i ansible/inventory.yml ansible/playbooks/databases.yml
```

- **ElasticSearch**: 3-node cluster for centralized logging
- **Redis**: 3-node cluster with sentinel for high-availability caching
- **MongoDB**: 3-node replica set for application data

### 4. Monitoring Stack

```bash
kubectl apply -f k8s/monitoring/
# Or via Helm:
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -f k8s/monitoring/kube-prometheus-stack-values.yaml \
  -n monitoring --create-namespace
```

Components:
- **Prometheus**: Metric collection + alerting rules
- **Grafana**: Dashboards with GitHub OAuth
- **Alertmanager**: Slack notifications (critical/warning routing)
- **Pre-configured datasources**: ElasticSearch, Loki, Jaeger

## Network Topology

| Network | Subnet | Purpose |
|---------|--------|---------|
| Proxmox Cluster | 10.0.10.0/24 | Corosync + VM migration |
| Kubernetes | 10.0.20.0/24 | MicroK8s pods + services |
| Databases | 10.0.30.0/24 | Database nodes |
| MetalLB | 10.0.20.100-200 | Load balancer IPs |
| VLAN | 100 | Guest network isolation |

## Variables

See `ansible/vars/default.yml` for configurable parameters:
- `proxmox_cluster_name`: Cluster identifier
- `metallb_ip_range`: Load balancer IP pool
- `es_heap_size`: ElasticSearch JVM heap
- `mongo_replica_set`: MongoDB RS name

## Production Considerations

1. **Storage**: Configure Ceph or a shared storage for live VM migration
2. **Backups**: Schedule Proxmox backup jobs to NFS/ S3
3. **Monitoring**: Import additional Grafana dashboards via ConfigMap
4. **Security**: Enable Proxmox firewall, configure Let's Encrypt for UIs
5. **Scaling**: Add more Proxmox nodes with `pvecm add`
