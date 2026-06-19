terraform {
  required_providers {
    proxmox = {
      source  = "telmate/proxmox"
      version = "~> 2.9"
    }
  }
}

provider "proxmox" {
  pm_api_url          = var.proxmox_api_url
  pm_api_token_id     = var.proxmox_api_token_id
  pm_api_token_secret = var.proxmox_api_token_secret
  pm_tls_insecure     = true
  pm_log_enable       = true
  pm_log_file         = "terraform-proxmox.log"
  pm_parallel         = 3
}

locals {
  ip_offset = 20
  node_ips  = [
    for i in range(var.node_count) :
    "${var.network_config.ip_prefix}.${local.ip_offset + i}"
  ]
}

resource "proxmox_vm_qemu" "k8s_nodes" {
  count       = var.node_count
  name        = var.node_names[count.index]
  target_node = var.target_node
  clone       = var.vm_template_name
  full_clone  = true
  agent       = 1
  os_type     = "cloud-init"

  cores    = var.vm_config.cores
  sockets  = var.vm_config.sockets
  memory   = var.vm_config.memory
  scsihw   = "virtio-scsi-pci"
  bootdisk = "scsi0"

  disk {
    slot    = 0
    size    = var.vm_config.disk_size
    type    = "scsi"
    storage = var.storage_pool
    iothread = true
  }

  network {
    model  = "virtio"
    bridge = var.network_config.bridge
    tag    = var.network_config.vlan_tag
  }

  lifecycle {
    ignore_changes = [
      network,
      disk,
      clone,
    ]
  }

  # Cloud-init configuration
  os_network_config = templatefile("${path.module}/templates/network-config.tpl", {
    ip_address = local.node_ips[count.index]
    netmask    = "24"
    gateway    = var.network_config.gateway
    dns       = var.network_config.dns_servers
  })

  sshkeys = var.ssh_public_key

  connection {
    type        = "ssh"
    user        = var.ci_user
    private_key = file(var.ssh_public_key)
    host        = local.node_ips[count.index]
  }

  provisioner "remote-exec" {
    inline = [
      "echo 'Node ${var.node_names[count.index]} provisioned successfully'",
      "hostnamectl set-hostname ${var.node_names[count.index]}",
      "echo '${local.node_ips[count.index]} ${var.node_names[count.index]}.banking.internal ${var.node_names[count.index]}' >> /etc/hosts",
    ]
  }
}
