terraform {
  required_version = ">= 1.5.0"

  required_providers {
    lxd = {
      source  = "terraform-lxd/lxd"
      version = "~> 1.10"
    }
  }
}

provider "lxd" {}

resource "lxd_profile" "app" {
  name = var.lxd_profile_name

  config = {
    "limits.cpu"    = tostring(var.lxd_cpu)
    "limits.memory" = var.lxd_memory
  }

  device {
    name = "root"
    type = "disk"
    properties = {
      path = "/"
      pool = var.lxd_storage_pool
    }
  }

  device {
    name = "eth0"
    type = "nic"
    properties = {
      name    = "eth0"
      network = var.lxd_network
    }
  }
}

resource "lxd_instance" "app" {
  name            = var.lxd_container_name
  image           = var.lxd_image
  type            = "container"
  profiles        = [lxd_profile.app.name]
  start_on_create = true
}
