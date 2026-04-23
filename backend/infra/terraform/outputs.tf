output "lxd_container_name" {
  description = "Name of the provisioned app container"
  value       = lxd_instance.app.name
}

output "lxd_profile_name" {
  description = "Name of the profile attached to the app container"
  value       = lxd_profile.app.name
}
