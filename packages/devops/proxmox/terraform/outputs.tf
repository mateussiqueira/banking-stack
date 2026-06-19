output "node_ips" {
  description = "IP addresses of the provisioned Kubernetes nodes"
  value = {
    for idx, node in proxmox_vm_qemu.k8s_nodes :
    node.name => node.default_ipv4_address
  }
}

output "node_names" {
  description = "Names of the provisioned nodes"
  value       = proxmox_vm_qemu.k8s_nodes[*].name
}

output "k8s_master_ip" {
  description = "IP address of the first control-plane node"
  value       = length(proxmox_vm_qemu.k8s_nodes) > 0 ? proxmox_vm_qemu.k8s_nodes[0].default_ipv4_address : null
}

output "ssh_connection_strings" {
  description = "SSH connection strings for each node"
  value = [
    for idx, node in proxmox_vm_qemu.k8s_nodes :
    "ssh ${var.ci_user}@${node.default_ipv4_address}"
  ]
}

output "kubeconfig_command" {
  description = "Command to fetch kubeconfig from the master node"
  value       = "scp ${var.ci_user}@${length(proxmox_vm_qemu.k8s_nodes) > 0 ? proxmox_vm_qemu.k8s_nodes[0].default_ipv4_address : ""}:~/.kube/config ./kubeconfig"
}

output "inventory_yml" {
  description = "Ansible inventory snippet for the provisioned nodes"
  value = templatefile("${path.module}/templates/inventory-snippet.tpl", {
    nodes = {
      for idx, node in proxmox_vm_qemu.k8s_nodes :
      node.name => node.default_ipv4_address
    }
  })
}
