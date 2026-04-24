variable "lxd_container_name" {
  description = "Name of the LXD container that runs the app"
  type        = string
  default     = "devops-lab-app"
}

variable "lxd_profile_name" {
  description = "Name of the LXD profile used by the app container"
  type        = string
  default     = "devops-lab-profile"
}

variable "lxd_image" {
  description = "LXD image alias used to create the container"
  type        = string
  default     = "ubuntu:22.04"
}

variable "lxd_storage_pool" {
  description = "LXD storage pool name"
  type        = string
  default     = "default"
}

variable "lxd_network" {
  description = "LXD network name"
  type        = string
  default     = "lxdbr0"
}

variable "lxd_cpu" {
  description = "CPU core limit for the container"
  type        = number
  default     = 2
}

variable "lxd_memory" {
  description = "Memory limit for the container"
  type        = string
  default     = "2GB"
}

variable "lxd_static_ipv4_enabled" {
  description = "Whether to configure static IPv4 and DNS inside the container via cloud-init"
  type        = bool
  default     = true
}

variable "lxd_ipv4_address" {
  description = "Static IPv4 address assigned to the container"
  type        = string
  default     = "10.100.219.50"
}

variable "lxd_ipv4_prefix" {
  description = "CIDR prefix length for the static IPv4 address"
  type        = number
  default     = 24
}

variable "lxd_ipv4_gateway" {
  description = "Default IPv4 gateway for the container"
  type        = string
  default     = "10.100.219.1"
}

variable "lxd_dns_servers_ipv4" {
  description = "IPv4 DNS servers configured inside the container"
  type        = list(string)
  default     = ["1.1.1.1", "8.8.8.8"]
}

variable "lxd_dns_servers_ipv6" {
  description = "IPv6 DNS servers configured inside the container"
  type        = list(string)
  default     = ["2606:4700:4700::1111", "2001:4860:4860::8888"]
}
