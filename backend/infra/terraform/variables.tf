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
