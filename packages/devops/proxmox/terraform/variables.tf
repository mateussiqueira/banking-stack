variable "proxmox_api_url" {
  description = "Proxmox VE API endpoint"
  type        = string
}

variable "proxmox_api_token_id" {
  description = "API token ID for Proxmox authentication"
  type        = string
  sensitive   = true
}

variable "proxmox_api_token_secret" {
  description = "API token secret for Proxmox authentication"
  type        = string
  sensitive   = true
}

variable "vm_template_name" {
  description = "Name of the VM template to clone from"
  type        = string
  default     = "ubuntu-2404-template"
}

variable "node_count" {
  description = "Number of K8s nodes to provision"
  type        = number
  default     = 3
}

variable "vm_config" {
  description = "VM resource configuration"
  type = object({
    cores    = number
    sockets  = number
    memory   = number
    disk_size = string
  })
  default = {
    cores     = 4
    sockets   = 1
    memory    = 8192
    disk_size = "50G"
  }
}

variable "network_config" {
  description = "Network configuration for VMs"
  type = object({
    bridge    = string
    vlan_tag  = number
    ip_prefix = string
    gateway   = string
    dns_servers = list(string)
  })
  default = {
    bridge    = "vmbr0"
    vlan_tag  = 100
    ip_prefix = "10.0.0"
    gateway   = "10.0.0.1"
    dns_servers = ["8.8.8.8", "1.1.1.1"]
  }
}

variable "node_names" {
  description = "Names for the Kubernetes nodes"
  type        = list(string)
  default     = ["k8s-master-1", "k8s-node-1", "k8s-node-2"]
}

variable "target_node" {
  description = "Proxmox node to create VMs on"
  type        = string
  default     = "proxmox-master"
}

variable "storage_pool" {
  description = "Proxmox storage pool for VM disks"
  type        = string
  default     = "local-lvm"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  sensitive   = true
}

variable "ci_user" {
  description = "Cloud-init user"
  type        = string
  default     = "ubuntu"
}

variable "ci_password" {
  description = "Cloud-init password (hashed)"
  type        = string
  sensitive   = true
  default     = null
}
