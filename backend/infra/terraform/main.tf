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

locals {
  lxd_nameservers = concat(var.lxd_dns_servers_ipv4, var.lxd_dns_servers_ipv6)

  lxd_eth0_properties = merge(
    {
      name    = "eth0"
      network = var.lxd_network
    },
    var.lxd_static_ipv4_enabled ? { "ipv4.address" = var.lxd_ipv4_address } : {}
  )

  lxd_cloud_init_network_config = yamlencode({
    version = 2
    ethernets = {
      eth0 = {
        dhcp4 = false
        dhcp6 = true
        addresses = [
          "${var.lxd_ipv4_address}/${var.lxd_ipv4_prefix}"
        ]
        routes = [
          {
            to  = "default"
            via = var.lxd_ipv4_gateway
          }
        ]
        nameservers = {
          addresses = local.lxd_nameservers
        }
      }
    }
  })
}

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
    name       = "eth0"
    type       = "nic"
    properties = local.lxd_eth0_properties
  }
}

resource "lxd_instance" "app" {
  name            = var.lxd_container_name
  image           = var.lxd_image
  type            = "container"
  profiles        = [lxd_profile.app.name]
  start_on_create = true
  config = var.lxd_static_ipv4_enabled ? {
    "cloud-init.network-config" = local.lxd_cloud_init_network_config
    "user.network-config"       = local.lxd_cloud_init_network_config
  } : {}
}
