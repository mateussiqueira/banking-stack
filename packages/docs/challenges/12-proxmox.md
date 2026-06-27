# 12 — DevOps Proxmox

**🇧🇷** Infraestrutura com Proxmox VE  
**🇬🇧** Proxmox VE Infrastructure

---

## Descrição do Desafio

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

## Why Proxmox?

I get this question a lot. "Why not just use plain Docker? Why not VMware? Why not bare-metal?"

Here's the thing: when you're running a banking stack that includes PostgreSQL, MongoDB, Redis, a ledger service, an SPI simulator, a KYC frontend, plus a CI/CD runner — that's easily 7-8 services right there. Running all of them on a single Linux install is a recipe for dependency hell. Running each on separate bare-metal machines is expensive and wasteful.

I needed a middle ground. I needed the isolation of separate machines without the cost. I needed snapshots so I could experiment freely and roll back in seconds. I needed to provision new environments fast.

Proxmox VE gives me all of that. It's a Type-1 hypervisor based on Debian with KVM and LXC baked in. It has a web UI, a REST API, native ZFS support, clustering, HA — and it's completely open source.

I chose it over VMware because VMware's free tier is crippled (no API, no backups). I chose it over Hyper-V because I run on Linux. I chose it over bare-metal Docker because I wanted VM-level isolation for the database nodes — I don't want a containerized PostgreSQL crashing because some CI job ran `rm -rf /` inside a container.

And honestly? The API is the killer feature. I can script my entire infrastructure. I can spin up a complete banking environment with one command. Try doing that with a hypervisor that only has a web GUI.

---

## Hardware Considerations

Before you install anything, think about your hardware. I'm running this on a repurposed workstation — an old Dell Precision with 32GB RAM and a 500GB SSD. Here's what I learned:

- **RAM**: Proxmox itself uses about 1GB. Each VM needs at least 2-4GB. Each LXC container uses practically nothing (20-50MB). For this stack, 16GB is the minimum. 32GB is comfortable. 64GB means you can run everything and still have room for experiments.
- **Storage**: ZFS loves RAM. If you use ZFS (and you should), allocate at least 8GB just for the ARC cache. For the actual storage, aim for at least 256GB SSD. 500GB+ is better because you'll want snapshots and backups.
- **CPU**: Proxmox runs fine on 4 cores. Each VM needs 1-2 cores. An 8-core CPU is ideal for this stack. Modern CPUs with AES-NI make a big difference for encrypted storage.
- **Network**: A single gigabit NIC is fine for home labs. For production, you'd want at least two — one for management, one for VM traffic.

My biggest mistake the first time? I tried running everything on a machine with 8GB RAM. PostgreSQL alone consumed 2GB. MongoDB ate another 2GB. The Docker host VM needed 4GB. I was swapping constantly. Learn from me — don't cheap out on RAM.

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

This architecture wasn't my first draft. Originally I tried running everything in LXC containers. Cheap and fast, right? The problem: LXC shares the host kernel. You can't run Docker inside a privileged LXC without serious security concerns, and you can't run Docker inside an unprivileged LXC at all.

So I split the difference: LXC for the CI/CD runner (which doesn't need Docker isolation since it already runs in a container), and full VMs for the actual services. Each VM gets its own kernel, its own memory allocation, its own everything. The Docker Host VM runs containers in Docker Compose. The Application Server VM runs the frontends and reverse proxy.

Here's a more detailed deployment view showing the port mappings and inter-service communication:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Detailed Network Topology                          │
│                                                                        │
│  Internet                                                              │
│     │                                                                  │
│     ▼                                                                  │
│  ┌──────────┐  :80/:443                                               │
│  │ Router   ├──────────────────────────────────────────┐              │
│  └──────────┘                                          │              │
│     │                                                   │              │
│     ▼                                                   ▼              │
│  vmbr0 (192.168.1.0/24) — physical bridge                             │
│     │                                                   │              │
│     ├── Proxmox Host (192.168.1.100)                   │              │
│     │    ├── pveproxy (8006) — Web UI                   │              │
│     │    └── API (8006)                                │              │
│     │                                                   │              │
│     ├── VM 100: Docker Host (192.168.1.110)            │              │
│     │    ├── :5432 → PostgreSQL                        │              │
│     │    ├── :6379 → Redis                             │              │
│     │    ├── :27017 → MongoDB                          │              │
│     │    ├── :3002 → Ledger API                        │              │
│     │    ├── :3003 → SPI Simulator                     │              │
│     │    └── :3004 → DICT Simulator                     │              │
│     │                                                   │              │
│     ├── VM 101: App Server (192.168.1.111)              │              │
│     │    ├── :443 → Nginx → Next.js (3000)              │              │
│     │    └── :443 → Nginx → KYC (3001)                 │              │
│     │                                                   │              │
│     └── CT 200: CI/CD Runner (192.168.1.120)            │              │
│          └── GitHub Actions Runner                      │              │
└────────────────────────────────────────────────────────────────────────┘
```

I use the `vmbr0` bridge for all VMs. This puts them on the same LAN as the host, making inter-VM communication trivial. Each service talks to the others via their assigned IPs. For production, you'd put the databases on a separate VLAN (`vmbr1`) with firewall rules restricting access.

---

## Installation

I won't walk you through the Proxmox installer step by step — it's a straightforward Debian-based installer. But here are the critical decisions you need to make during installation:

**Filesystem: ZFS (RAID-1)**

I strongly recommend ZFS over ext4 or LVM. Here's why:
- **Snapshots**: ZFS snapshots are instant and nearly free. I can snapshot a VM before a risky upgrade and roll back in seconds.
- **Compression**: ZFS with `lz4` compression gives me about 2x effective storage with almost no CPU overhead.
- **Data integrity**: ZFS checksums every block. If a disk develops bad sectors, ZFS detects and (with mirroring) repairs it transparently.
- **ARC cache**: ZFS intelligently caches frequently-read data in RAM. For database VMs, this is a huge performance win.

The trade-off: ZFS eats RAM for its ARC cache. By default, ZFS will use up to 50% of system RAM. That's fine on a dedicated hypervisor, but if you're tight on memory, reduce it:

```bash
# Limit ZFS ARC to 4GB
echo "options zfs zfs_arc_max=4294967296" > /etc/modprobe.d/zfs.conf
update-initramfs -u
reboot
```

**Network: Static IP**

During installation, I assign a static IP. You can change it later, but doing it during install saves time:

```bash
# Post-install network change (if needed)
# /etc/network/interfaces
auto lo
iface lo inet loopback

auto vmbr0
iface vmbr0 inet static
  address 192.168.1.100/24
  gateway 192.168.1.1
  bridge-ports enp0s3
  bridge-stp off
  bridge-fd 0
```

**Enterprise Repository**

Proxmox's default repository requires a paid subscription. For home lab/testing, switch to the no-subscription repository:

```bash
# Remove enterprise repo
rm /etc/apt/sources.list.d/pve-enterprise.list

# Add no-subscription repo
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

apt update && apt dist-upgrade -y
```

Don't worry — the no-subscription repo is perfectly fine for development and testing. The only difference is you don't get production support from Proxmox. For my banking stack, that's acceptable.

---

## Network Configuration Deep Dive

Network configuration was where I spent most of my troubleshooting time. Let me save you the headaches.

### Bridged Networking (vmbr0)

Every VM I create uses the `virtio` driver on bridge `vmbr0`. This gives them direct access to the physical network, as if they were separate physical machines:

```bash
# Proxmox host /etc/network/interfaces
auto vmbr0
iface vmbr0 inet static
  address 192.168.1.100/24
  gateway 192.168.1.1
  bridge-ports enp0s3
  bridge-stp off
  bridge-fd 0
  bridge-maxwait 10
```

The VMs get their own IPs via DHCP or static assignment. I prefer static — saves me the headache of wondering "what IP did the DHCP server give my VM today":

```bash
# Inside the VM, /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    ens18:
      addresses: [192.168.1.110/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```

### Dedicated Storage Network (vmbr1)

For the databases, I recommend a second bridge on a separate subnet for storage traffic:

```bash
auto vmbr1
iface vmbr1 inet static
  address 10.10.0.1/24
  bridge-ports none
  bridge-stp off
  bridge-fd 0
```

This keeps backup traffic off the main network. Not strictly necessary for a home lab, but it's good practice and the configuration is trivial.

### VLAN Tagging

If your switch supports VLANs, Proxmox handles them beautifully. Just tag the bridge:

```bash
auto vmbr0.100
iface vmbr0.100 inet manual
  vlan-raw-device vmbr0
```

Assign a VLAN tag to a VM's network device via the API or web UI, and it's automatically isolated. For the banking stack, I'd put databases on VLAN 10, application servers on VLAN 20, and CI/CD on VLAN 30.

### Common Network Problems

Here are the three issues that burned me most:

**1. STP Forwarding Delay**

If the physical switch Spanning Tree Protocol takes time to converge, your VM may boot faster than the bridge is ready. Result: the VM gets no network. Fix:

```bash
# Reduce bridge forwarding delay
bridge_fd 0
```

**2. Jumbo Frames MTU Mismatch**

If you enable jumbo frames (MTU 9000) on your switch but forget to set it on the Proxmox bridge, you'll get mysterious packet loss on large transfers:

```bash
# Set MTU on bridge
auto vmbr0
iface vmbr0 inet static
  mtu 9000
  ...
```

**3. Firewall Blocking Inter-VM Traffic**

Proxmox's built-in firewall defaults to blocking inter-VM traffic. If your VMs can't talk to each other, check the firewall:

```bash
# Check firewall status
pve-firewall status

# Disable for testing (re-enable after)
systemctl stop pve-firewall
systemctl disable pve-firewall
```

For production, don't disable the firewall — create proper rules instead, but for a development environment, it's easier to disable it and use application-level security.

---

## Container LXC: Lightweight Powerhouses

I love LXC containers. They're not Docker — they're closer to lightweight VMs that share the host kernel. Each container gets its own filesystem, network stack, process tree, and (optionally) its own IP address.

### Creating an LXC Container

```
Proxmox VE Web UI → Datacenter → (node) → Create CT
```

But I never use the web UI for repetitive tasks. Here's the CLI approach:

```bash
# Download an Ubuntu 22.04 template
pveam update
pveam available --section system
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst

# Create a container
pct create 200 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname ci-runner \
  --memory 2048 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage local-zfs \
  --rootfs local-zfs:8 \
  --unprivileged 1 \
  --features keyctl=1,nesting=1
```

The flags:
- `--unprivileged 1`: Runs the container with user namespace mapping. Safer but can't mount block devices or change kernel settings.
- `--features keyctl=1`: Enables kernel keyring. Needed for Docker inside the container.
- `--features nesting=1`: Allows nested virtualization. Needed if you want Docker-in-Docker.

### Priviliged vs Unprivileged Containers

This is a trap I fell into head-first.

**Unprivileged containers** (default, recommended):
- UID/GID mapping: Container UID 0 maps to UID 100000 on the host
- Can't use `--privileged` in Docker
- Can't mount FUSE filesystems
- Can't change `sysctl` parameters
- Can't use `iptables` without workarounds

**Privileged containers**:
- Container UID 0 IS host UID 0
- Full access to host devices
- Can run Docker (with nesting)
- **Security risk**: If someone breaks out of the container, they're root on the host

For my CI/CD runner, I use an unprivileged container. The GitHub Actions runner doesn't need Docker (it talks to the API), and if someone compromises the runner, they're in a sandbox.

But if you absolutely need Docker inside LXC, you have two options:
1. Use a privileged container (easier, but less secure)
2. Use an unprivileged container with the Docker socket mounted from a VM (cleaner, but more complex)

I chose option 2: the CI/CD runner talks to the Docker daemon running inside the Docker Host VM over TCP:

```bash
# On the Docker Host VM
# /etc/docker/daemon.json
{
  "hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"],
  "tls": false
}
```

And from the CI/CD runner, I point to the remote Docker socket:

```bash
export DOCKER_HOST=tcp://192.168.1.110:2375
docker ps
```

For production, you'd add TLS. For a development lab, this is fine.

### LXC Bind Mounts

One neat feature: you can bind-mount host directories into LXC containers. I use this for shared backup storage:

```bash
# Bind mount backup directory into CT 200
pct set 200 -mp0 /mnt/backups,mp=/backups
```

This is instant — no resizing, no filesystem overhead. The container sees `/backups` with the contents of `/mnt/backups` on the host.

---

## VM Creation with Cloud-Init

Manual VM installation is tedious. Cloud-Init automates the initial setup — SSH keys, user accounts, packages, network config, everything.

### Step 1: Download a Cloud Image

```bash
# Download Ubuntu 22.04 LTS cloud image
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img
```

### Step 2: Create the VM

```bash
# Create VM with qm command
VMID=100
qm create $VMID \
  --name docker-host \
  --memory 4096 \
  --cores 4 \
  --net0 virtio,bridge=vmbr0 \
  --scsihw virtio-scsi-pci \
  --boot c \
  --ostype l26 \
  --cpu host \
  --agent 1

# Import the disk
qm importdisk $VMID jammy-server-cloudimg-amd64.img local-zfs

# Attach the disk
qm set $VMID --scsihw virtio-scsi-pci --scsi0 local-zfs:vm-$VMID-disk-0

# Add cloud-init drive
qm set $VMID --ide2 local-zfs:cloudinit

# Set boot order
qm set $VMID --boot order=scsi0

# Add a serial console (for Web UI access)
qm set $VMID --serial0 socket --vga serial0
```

### Step 3: Configure Cloud-Init

```bash
# Set cloud-init parameters
qm set $VMID --ciuser deploy
qm set $VMID --sshkeys ~/.ssh/id_rsa.pub
qm set $VMID --ipconfig0 ip=192.168.1.110/24,gw=192.168.1.1
qm set $VMID --cipassword "temporary-password"

# Start the VM
qm start $VMID
```

Cloud-Init runs on first boot and:
1. Creates the `deploy` user
2. Configures SSH authorized keys
3. Sets the static IP
4. Expands the root filesystem
5. Runs any custom scripts you provide

### Cloud-Init Customization with `user-data`

For more control, create a `user-data` file:

```yaml
# local:snippets/user-data.yml
#cloud-config
users:
  - name: deploy
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E... user@host
    lock_passwd: true

packages:
  - docker-ce
  - docker-ce-cli
  - containerd.io
  - htop
  - net-tools
  - curl
  - git

runcmd:
  - systemctl enable --now docker
  - usermod -aG docker deploy
  - curl -fsSL https://get.docker.com -o get-docker.sh
  - sh get-docker.sh
  - docker --version > /var/log/docker-install.log

final_message: "Banking Docker host is ready!"
```

Point the VM to this file:

```bash
qm set $VMID --cicustom "user=local:snippets/user-data.yml"
```

This is how I provision a new Docker host in about 90 seconds flat. From zero to running Docker with zero manual steps.

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
      },
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
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

### API Token Setup

Before you can use the API, you need an API token. Here's the process:

**Via Web UI:**
1. Datacenter → Permissions → API Tokens
2. Add → User: `user@pam` → Token ID: `banking-stack`
3. Copy the secret (it's shown only once!)
4. Assign privileges: `PVEAdmin` role on `/`

**Via CLI:**
```bash
# Create API token
pveum user add deploy@pve
pveum acl modify / -user deploy@pve -role PVEAdmin
pveum user token add deploy@pve banking-stack --privsep 0
```

The response gives you a `tokenId` and `secret`. Treat the secret like a password:

```typescript
const token = 'deploy@pve!banking-stack=abc123def456...';
```

### Error Handling and Retries

The Proxmox API isn't always reliable, especially during concurrent operations. Here's how I handle failures:

```typescript
async function safeCreateVM(client: ProxmoxClient, config: VMConfig, retries = 3): Promise<number> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await client.createVM(config);
    } catch (error) {
      if (attempt === retries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function waitForVM(vmid: number, timeout = 120000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const status = await proxmox.getVMStatus(vmid);
      if (status.status === 'running') return;
    } catch {
      // VM might not exist yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`VM ${vmid} did not start within ${timeout}ms`);
}
```

I also log every API call for audit purposes:

```typescript
function auditLog(action: string, data: any): void {
  console.log(`[${new Date().toISOString()}] ${action}`, JSON.stringify(data));
  // For real logging, write to a file or external service
}
```

### Full Automation Script

Here's the actual script I use to provision a complete banking environment:

```typescript
async function provisionBankingStack() {
  const proxmox = new ProxmoxClient(config);
  
  const VMS = [
    { vmid: 100, name: 'docker-host', memory: 4096, cores: 4, disk: 32 },
    { vmid: 101, name: 'app-server', memory: 2048, cores: 2, disk: 20 },
  ];
  
  for (const vmConfig of VMS) {
    console.log(`Creating ${vmConfig.name} (VM ${vmConfig.vmid})...`);
    
    const vmid = await safeCreateVM(proxmox, vmConfig);
    auditLog('vm:create', { vmid, name: vmConfig.name });
    
    // Wait for VM to be ready
    await waitForVM(vmid);
    console.log(`${vmConfig.name} is online.`);
    
    // Create a pre-update snapshot
    await proxmox.createSnapshot(vmid, 'pre-setup');
    auditLog('snapshot:create', { vmid, name: 'pre-setup' });
    
    // Ansible will handle the rest
    console.log(`Run: ansible-playbook -i inventory.ini playbooks/${vmConfig.name}.yml`);
  }
}

provisionBankingStack().catch(console.error);
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

### Full Ansible Role Structure

For production, I organize Ansible into roles rather than a flat playbook:

```
infra/ansible/
├── ansible.cfg
├── inventory.yml
├── playbooks/
│   ├── docker-hosts.yml
│   ├── app-servers.yml
│   └── databases.yml
├── roles/
│   ├── common/
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml
│   │   └── templates/
│   │       └── sysctl.conf.j2
│   ├── docker/
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml
│   │   ├── templates/
│   │   │   └── daemon.json.j2
│   │   └── defaults/main.yml
│   ├── postgres/
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml
│   │   └── templates/
│   │       └── postgresql.conf.j2
│   └── monitoring/
│       ├── tasks/main.yml
│       └── templates/
│           └── node_exporter.service.j2
└── vars/
    └── default.yml
```

The `docker` role with templates:

```yaml
# roles/docker/tasks/main.yml
---
- name: Create Docker config directory
  file:
    path: /etc/docker
    state: directory
    mode: '0755'

- name: Configure Docker daemon
  template:
    src: daemon.json.j2
    dest: /etc/docker/daemon.json
  notify: restart docker

- name: Start and enable Docker
  service:
    name: docker
    state: started
    enabled: yes
```

```json
// roles/docker/templates/daemon.json.j2
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true,
  "iptables": true,
  "ip-forward": true
}
```

The `live-restore: true` is critical — it keeps containers running even if the Docker daemon is restarted for upgrades. Without it, a `systemctl restart docker` kills every running container.

### Ansible Vault for Secrets

Never put passwords in plaintext playbooks. Use Ansible Vault:

```bash
# Create encrypted vars
ansible-vault create vars/secrets.yml

# Inside vars/secrets.yml (encrypted)
postgres_password: supersecurepassword123
mongodb_password: anotherstrongpassword

# Reference in playbook
- include_vars: vars/secrets.yml

# Run with vault password
ansible-playbook playbooks/databases.yml --ask-vault-pass
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

### Terraform Variables

```hcl
# variables.tf
variable "vm_count" {
  description = "Number of VMs to create"
  type        = number
  default     = 2
}

variable "vm_base_name" {
  description = "Base name for VMs"
  type        = string
  default     = "banking"
}

variable "vm_ips" {
  description = "IP addresses for each VM"
  type        = list(string)
  default     = ["192.168.1.110", "192.168.1.111"]
}

variable "node_name" {
  description = "Proxmox node name"
  type        = string
  default     = "node1"
}

variable "ssh_public_key" {
  description = "SSH public key for VMs"
  type        = string
  sensitive   = true
}
```

### Terraform Outputs

```hcl
# outputs.tf
output "vm_ids" {
  description = "IDs of created VMs"
  value       = proxmox_vm_qemu.banking[*].vmid
}

output "vm_names" {
  description = "Names of created VMs"
  value       = proxmox_vm_qemu.banking[*].name
}

output "ansible_inventory" {
  description = "Ansible inventory content"
  value       = templatefile("${path.module}/templates/inventory.tpl", {
    hosts = proxmox_vm_qemu.banking
  })
}
```

### Complete Terraform + Ansible Workflow

I chain Terraform and Ansible together like this:

```bash
# Step 1: Create VMs
cd infra/terraform/proxmox
terraform init
terraform plan
terraform apply -auto-approve

# Step 2: Generate dynamic inventory
terraform output -json > /tmp/vm_info.json

# Step 3: Add VMs to known_hosts
for ip in $(terraform output -json vm_ips | jq -r '.[]'); do
  ssh-keyscan -H $ip >> ~/.ssh/known_hosts
done

# Step 4: Wait for SSH
for ip in $(terraform output -json vm_ips | jq -r '.[]'); do
  until nc -z $ip 22; do
    echo "Waiting for $ip:22..."
    sleep 2
  done
done

# Step 5: Run Ansible
cd infra/ansible
ansible-playbook -i inventory.yml playbooks/site.yml
```

This whole workflow takes about 3 minutes. I can destroy everything and rebuild from scratch faster than most people can manually install Docker once.

---

## Backup Strategy

Backups are not optional. Here's my strategy:

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-banking.sh

BACKUP_DIR="/mnt/backups/banking"
DATE=$(date +%Y%m%d-%H%M)
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Backup VMs
for VMID in 100 101; do
  VMNAME=$(qm config $VMID | grep name | awk '{print $2}')
  echo "Backing up $VMNAME (VM $VMID)..."
  
  # Create snapshot before backup
  qm snapshot $VMID "backup-$DATE" --description "Automatic backup"
  
  # Backup with vzdump
  vzdump $VMID \
    --compress zstd \
    --mode snapshot \
    --storage backups \
    --notes "Banking stack: $VMNAME"
  
  # Remove snapshot after backup
  qm delsnapshot $VMID "backup-$DATE"
done

# Backup LXC containers
for CTID in 200; do
  CTNAME=$(pct config $CTID | grep hostname | awk '{print $2}')
  echo "Backing up $CTNAME (CT $CTID)..."
  
  vzdump $CTID \
    --compress zstd \
    --mode snapshot \
    --storage backups
done

# Database dump (inside Docker Host VM)
ssh deploy@192.168.1.110 "docker exec postgres pg_dumpall -U postgres > /tmp/pg-dump.sql"
scp deploy@192.168.1.110:/tmp/pg-dump.sql "$BACKUP_DIR/pg-dump-$DATE.sql"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.zst" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
```

I run this daily via cron:

```bash
# /etc/cron.d/banking-backups
0 3 * * * root /usr/local/bin/backup-banking.sh >> /var/log/backup.log 2>&1
```

### Backup Modes Explained

`vzdump` supports three backup modes:

| Mode | Description | Best for |
|------|-------------|----------|
| `stop` | Shuts down the VM before backup | Consistency guaranteed, but downtime |
| `snapshot` | Creates a temporary snapshot, backs up the snapshot | No downtime, some I/O overhead |
| `suspend` | Suspends the VM, backs up, resumes | Short pause, good for non-critical |

I always use `snapshot` mode. The backup is consistent because the filesystem is frozen (Proxmox uses QEMU's `guest-fsfreeze` if the QEMU guest agent is installed). The VM doesn't notice anything.

### Restore from Backup

"Backups are worthless if you never test a restore." I learned this the hard way.

Here's my restore testing script:

```bash
#!/bin/bash
# /usr/local/bin/test-restore.sh

# Find latest backup
BACKUP_FILE=$(ls -t /var/lib/vz/dump/vzdump-qemu-100-*.vma.zst | head -1)
echo "Testing restore from: $BACKUP_FILE"

# Restore to a temporary VM ID (200 is unused in production)
echo "Restoring to VM 999 for testing..."
qmrestore "$BACKUP_FILE" 999 --storage local-zfs

# Start test VM
qm start 999

# Wait and check
sleep 30
curl -f http://192.168.1.110:3002/health
if [ $? -eq 0 ]; then
  echo "Restore test PASSED"
else
  echo "Restore test FAILED"
fi

# Cleanup
qm stop 999
qm destroy 999
echo "Test VM cleaned up"
```

I run this weekly. If the restore fails, I get paged before I actually need it.

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

### Proxmox Built-in Monitoring

```bash
# Host resource usage
pveperf
pvesh get /nodes/node1/status

# Real-time VM monitoring
watch -n 2 'qm list && echo "---" && free -h && echo "---" && df -h'

# ZFS pool status
zpool status -v
zfs list

# ARC statistics
cat /proc/spl/kstat/zfs/arcstats | head -20

# Check for errors
journalctl -u pvedaemon -n 50 --no-pager
```

### Grafana + Prometheus Monitoring

For real monitoring, I set up Prometheus with the Proxmox exporter:

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana

  proxmox-exporter:
    image: prometheus-pve-exporter
    volumes:
      - ./pve.yml:/etc/prometheus/pve.yml
    ports:
      - "9221:9221"

volumes:
  grafana-data:
```

```yaml
# pve.yml
default:
  user: prometheus@pam
  token_name: exporter
  token_value: "secret-token"
  verify_ssl: false
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'proxmox'
    static_configs:
      - targets: ['192.168.1.100:9221']
```

The key metrics I track:

| Metric | What it tells me | Warning threshold |
|--------|-----------------|-------------------|
| CPU usage | Overall load | >80% for 5 min |
| Memory usage | RAM pressure | >90% |
| ARC hit rate | ZFS cache efficiency | <80% |
| Disk I/O wait | Storage bottleneck | >10% |
| Network errors | Link issues | >0 |

### Proxmox VE Performance Monitoring Tools

Proxmox ships with several performance tools. Here are the ones I use daily:

```bash
# CPU and memory per process
top -u www-data -b -n 1

# I/O stats per device
iostat -x 1 5

# Network throughput per interface
nload vmbr0

# Detailed ZFS performance
zpool iostat -v 1 5

# Check for OOM kills
dmesg | grep -i "oom\|killed"
```

### Common Performance Issues

**Problem: VM feels slow, disk I/O is high**

Check if you're using the right disk cache mode:

```bash
# Check cache mode
qm config 100 | grep cache

# Set writeback cache (faster but riskier)
qm set 100 --scsi0 local-zfs:vm-100-disk-0,cache=writeback

# Safer: set cache=unsafe (for development only!)
qm set 100 --scsi0 local-zfs:vm-100-disk-0,cache=unsafe
```

Cache mode trade-offs:
- `none`: Every write goes directly to disk. Safest, slowest.
- `writeback`: Writes are acknowledged when they hit the host page cache. Fast, risk of data loss on host crash.
- `unsafe`: Writes are acknowledged immediately, bypassing guest cache. Fastest, risk of guest data corruption on crash.

For databases (PostgreSQL, MongoDB), use `none` or `writeback` with a UPS. For CI/CD runners, `unsafe` is fine — they're ephemeral anyway.

**Problem: High CPU steal time**

CPU steal means the hypervisor is overcommitted:

```bash
# Check steal time inside VM
vmstat 1 5

# If 'st' column is consistently > 10%, reduce overallocation
# Check host allocation
pvesh get /nodes/node1/status --output-format json | jq '.cpu'
```

Proxmox defaults to no CPU overcommit limit. I set mine to a 4:1 ratio:

```bash
# In /etc/pve/qemu-server/100.conf
# Limit CPU to 50% of host CPU
cpulimit: 50

# Or use CPU units (relative weight)
cpuunits: 1024
```

---

## Networking Troubleshooting Guide

Over my months running Proxmox, I've collected a hall of shame of network issues. Here are my fixes:

### "VM can't reach the internet"

```bash
# Check if host has internet
ping 8.8.8.8

# Check bridge configuration
cat /etc/network/interfaces

# Check if IP forwarding is enabled
sysctl net.ipv4.ip_forward

# Check iptables
iptables -L -n

# Temporarily disable firewall
pve-firewall stop

# Check VM network config inside the VM
# (might need to use VNC/SPICE console)
ip addr show
ip route show
```

Most common cause: **the bridge isn't set to the correct physical interface**. `bridge-ports` must match your actual NIC name:

```bash
# Find your NIC
ip link show
# Look for something like enp0s3, eth0, ens18
```

### "Proxmox web UI is unreachable"

```bash
# Check if pveproxy is running
systemctl status pveproxy

# Restart if needed
systemctl restart pveproxy

# Check port binding
ss -tlnp | grep 8006

# Certificates expired?
ls -la /etc/pve/local/pve-ssl.pem
openssl x509 -in /etc/pve/local/pve-ssl.pem -text -noout | grep -A2 Validity
```

If the self-signed certificate expired (yes, this happens), regenerate it:

```bash
pvecm updatecerts --force
systemctl restart pveproxy
```

### "LXC container can't resolve DNS"

```bash
# Inside container
cat /etc/resolv.conf

# If it points to the host, the host's DNS is the resolver
# Check host's DNS
cat /etc/resolv.conf

# Fix: configure container to use external DNS directly
pct set 200 --nameserver 8.8.8.8
pct set 200 --searchdomain local
```

### "Backup failed: can't open file"

```bash
# Check storage status
pvesh get /storage

# Check disk space
df -h

# Check zpool status
zpool list
zpool status

# Look for specific backup errors
journalctl -u vzdump -n 100
```

Most common: ZFS pool is full. ZFS gets cranky when it hits 90% usage — performance degrades significantly:

```bash
# Check pool usage
zfs list

# Add more space (if you have another disk)
zpool add local-zfs /dev/sdb

# Or set a quota
zfs set quota=400G local-zfs
```

---

## Post-Installation Hardening Security

Proxmox out of the box is not production-ready security-wise. Here's what I do after every fresh install:

```bash
# 1. Create a non-root admin user
pveum user add admin@pve --password "strong-password"
pveum acl modify / -user admin@pve -role Administrator

# 2. Disable root login over SSH
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# 3. Enable 2FA for the web UI
pveum user modify root@pam --enable-totp

# 4. Configure the firewall
cat > /etc/pve/firewall/host.fw << 'EOF'
[OPTIONS]
enable: 1

[RULES]
IN SSH(ACCEPT) -source 192.168.0.0/16
IN ACCEPT -source 10.0.0.0/8
IN DROP
EOF

# 5. Keep the system updated
cat > /etc/cron.daily/pve-updates << 'EOF'
#!/bin/bash
apt update && apt dist-upgrade -y
pveupdate
pveupgrade
EOF
chmod +x /etc/cron.daily/pve-updates

# 6. Set up fail2ban
apt install fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[proxmox]
enabled = true
port = 8006
filter = proxmox
logpath = /var/log/pveproxy/access.log
maxretry = 3
bantime = 3600
EOF
systemctl restart fail2ban
```

---

## Performance Tuning

These are the settings I use for the Docker Host VM (VM 100), which runs the databases:

```bash
# Inside the VM, /etc/sysctl.d/99-databases.conf

# Increase max connections
net.core.somaxconn = 65535

# Optimize TCP
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_congestion_control = bbr

# Increase file descriptors
fs.file-max = 2097152

# Virtual memory for databases
vm.swappiness = 1
vm.dirty_ratio = 30
vm.dirty_background_ratio = 5

# Transparent Hugepages for MongoDB
# (check with: cat /sys/kernel/mm/transparent_hugepage/enabled)
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag
```

These settings gave me about a 15-20% improvement in database query throughput. The BBR congestion control algorithm is especially helpful if your VMs are on different physical hosts.

---

## Lessons Learned

Here's what I wish someone had told me before I started:

1. **ZFS is amazing, but L2ARC rarely helps.** Don't bother with a separate SSD for L2ARC unless your working set is truly enormous. The ARC in RAM is orders of magnitude faster.

2. **Snapshot before everything.** Before any upgrade, any config change, any experiment — take a snapshot. The cost is zero. The value is immeasurable.

3. **Don't oversubscribe memory.** KVM VMs allocate their RAM upfront. If you create VMs that sum to more RAM than the host has, Proxmox will swap and everything slows to a crawl. I keep a 20% buffer.

4. **CPU oversubscription is OK.** I run 12 virtual cores on a 4-core machine and it works fine — most VMs are idle most of the time. Just don't oversubscribe memory.

5. **Use the API, not the web UI.** The web UI is fine for inspection, but everything else should be scripted. A script documents itself. A web UI session leaves no trace.

6. **Test your backups.** I mentioned this already, but it bears repeating. An untested backup is not a backup. It's a false sense of security.

7. **The Community Repository is not inferior.** The `pve-no-subscription` repo is the same software, just without paid support. Don't let anyone shame you for using it in development.

8. **Write down your configuration.** I keep a Markdown file with every `qm set` command and every `/etc/network/interfaces` change. When something breaks (and it will), I can trace exactly what I changed.

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
| **ZFS** | Storage & snapshots |
| **Cloud-Init** | VM initialization |
| **Prometheus** | Metrics collection |
| **Grafana** | Dashboards |
| **vzdump** | Backup utility |

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

# Check status
ssh deploy@192.168.1.110 'docker ps && docker compose ps'

# Manual backup
ssh root@proxmox-host /usr/local/bin/backup-banking.sh

# View web UI
open https://192.168.1.100:8006

# Check monitoring dashboard
open http://192.168.1.110:3000
```

The Proxmox setup is the foundation. Everything else — CI/CD, monitoring, deployment — runs on top of it. Get this right, and the rest is smooth sailing.
