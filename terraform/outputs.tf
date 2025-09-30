# Outputs for OAuth 2.1 MCP Gateway Terraform configuration

output "worker_url" {
  description = "URL of the deployed worker"
  value       = "https://${var.domain_name}"
}

output "worker_script_name" {
  description = "Name of the worker script"
  value       = try(cloudflare_worker_script.gateway_with_bindings.name, "")
}

output "kv_namespace_id" {
  description = "ID of the KV namespace"
  value       = try(cloudflare_workers_kv_namespace.sessions.id, "")
}

output "d1_database_id" {
  description = "ID of the D1 database"
  value       = try(cloudflare_d1_database.main.id, "")
}

output "r2_bucket_name" {
  description = "Name of the R2 bucket"
  value       = try(cloudflare_r2_bucket.storage.name, "")
}

output "environment" {
  description = "Deployed environment"
  value       = var.environment
}

output "domain_name" {
  description = "Configured domain name"
  value       = var.domain_name
}