# Challenge 12 — DevOps Proxmox

**🇧🇷** Infraestrutura com Proxmox VE  
**🇬🇧** Proxmox VE Infrastructure

---

## Challenge Description

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

## Challenge Description

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

## Architecture

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

---

## Proxmox API Automation

```typescript
import axios from 'axios';

interface ProxmoxConfig {
  host: string;
  token: string;
  nodeId: string;
}

class ProxmoxClient {
  private client: axios.AxiosInstance;

  constructor(config: ProxmoxConfig) {
    this.client = axios.create({
      baseURL: `https://${config.host}:8006/api2/json`,
      headers: {
        'Authorization': `PVEAPIToken=${config.token}`
      }
    });
  }

  async createVM(config: VMConfig): Promise<number> {
    const response = await this.client.post(
      `/nodes/${this.nodeId}/qemu`,
      {
        vmid: config.vmid,
        name: config.name,
        memory: config.memory,
        cores: config.cores,
        net0: `virtio,bridge=vmbr0`,
        scsihw: 'virtio-scsi-pci',
        scsi0: `local-zfs:vm-${config.vmid}-disk-0,size=${config.disk}G`,
        ostype: 'l26',
        cpu: 'host',
        sockets: 1
      }
    );
    return response.data.data;
  }

  async startVM(vmid: number): Promise<void> {
    await this.client.post(`/nodes/${this.nodeId}/qemu/${vmid}/status/start`);
  }

  async stopVM(vmid: number): Promise<void> {
    await this.client.post(`/nodes/${this.nodeId}/qemu/${vmid}/status/stop`);
  }

  async createSnapshot(vmid: number, name: string): Promise<void> {
    await this.client.post(
      `/nodes/${this.nodeId}/qemu/${vmid}/snapshot`,
      { snapname: name }
    );
  }

  async restoreSnapshot(vmid: number, name: string): Promise<void> {
    await this.client.post(
      `/nodes/${this.nodeId}/qemu/${vmid}/snapshot/${name}/rollback`
    );
  }

  async getVMStatus(vmid: number): Promise<VMStatus> {
    const response = await this.client.get(
      `/nodes/${this.nodeId}/qemu/${vmid}/status/current`
    );
    return response.data.data;
  }
}

// Example usage
const proxmox = new ProxmoxClient({
  host: '192.168.1.100',
  token: 'user@pam!token:abc123...',
  nodeId: 'node1'
});

// Create a Docker host VM
const vmid = await proxmox.createVM({
  vmid: 100,
  name: 'docker-host',
  memory: 4096,
  cores: 4,
  disk: 32
});

await proxmox.startVM(vmid);
```

---

## Ansible Playbook for Proxmox

```yaml
---
# playbook: setup-docker-host.yml
- name: Setup Docker Host on Proxmox VM
  hosts: docker-hosts
  become: yes
  
  vars:
    docker_version: "5:24.0"
    compose_version: "v2.23.0"
  
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
    
    - name: Install Docker prerequisites
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - gnupg
          - lsb-release
        state: present
    
    - name: Add Docker GPG key
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present
    
    - name: Add Docker repository
      apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
    
    - name: Install Docker
      apt:
        name: docker-ce={{ docker_version }} docker-ce-cli containerd.io
        state: present
    
    - name: Add user to docker group
      user:
        name: "{{ ansible_user }}"
        groups: docker
        append: yes
    
    - name: Install Docker Compose
      get_url:
        url: "https://github.com/docker/compose/releases/download/{{ compose_version }}/docker-compose-linux-x86_64"
        dest: /usr/local/bin/docker-compose
        mode: '0755'
    
    - name: Create docker-compose directory
      file:
        path: /opt/banking-stack
        state: directory
        mode: '0755'
    
    - name: Copy docker-compose.yml
      copy:
        src: docker-compose.yml
        dest: /opt/banking-stack/docker-compose.yml
    
    - name: Start services
      command: docker-compose up -d
      args:
        chdir: /opt/banking-stack
```

---

## Terraform Provider

```hcl
# main.tf
terraform {
  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "2.9.14"
    }
  }
}

provider "proxmox" {
  pm_api_url      = "https://192.168.1.100:8006/api2/json"
  pm_api_token_id = "user@pam!token"
  pm_api_token_secret = "abc123..."
}

resource "proxmox_vm_qemu" "docker-host" {
  name        = "docker-host"
  target_node = "node1"
  vmid        = "100"
  
  memory  = 4096
  cores   = 4
  sockets = 1
  
  disk {
    size    = "32G"
    storage = "local-zfs"
    type    = "scsi"
  }
  
  network {
    model  = "virtio"
    bridge = "vmbr0"
  }
  
  os_type = "l26"
  
  # Cloud-init
  cicustom = "user=local:snippets/user-data.yml"
}
```

---

## Resource Monitoring

```bash
# Check VM status
qm status 100

# List all VMs
qm list

# Check resource usage
pvesh get /nodes/node1/qemu/100/status/current

# Backup VM
vzdump 100 --storage local --compress zstd

# Restore backup
qmrestore /var/lib/vz/dump/vzdump-qemu-100-*.vma.zst 100
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Proxmox VE** | Hypervisor/management |
| **LXC** | Lightweight containers |
| **Docker** | Application containers |
| **Nginx** | Reverse proxy |
| **Terraform** | IaC |
| **Ansible** | Configuration management |

---

## How to Run

```bash
# Clone the repo
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack

# Run Terraform
cd infra/terraform/proxmox
terraform init
terraform plan
terraform apply

# Run Ansible
cd infra/ansible
ansible-playbook -i inventory setup-docker-host.yml
```
