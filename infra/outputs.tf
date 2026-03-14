# =============================================================================
# Outputs
# =============================================================================

output "cloud_run_url" {
  description = "URL of the AI Ops Portal Cloud Run service"
  value       = google_cloud_run_v2_service.portal.uri
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name (for Cloud SQL Proxy)"
  value       = google_sql_database_instance.main.connection_name
}

output "cloud_sql_private_ip" {
  description = "Cloud SQL private IP address"
  value       = google_sql_database_instance.main.private_ip_address
  sensitive   = true
}

output "bigquery_dataset_id" {
  description = "BigQuery analytics dataset ID"
  value       = google_bigquery_dataset.analytics.dataset_id
}

output "bigquery_dataset_self_link" {
  description = "BigQuery analytics dataset self link"
  value       = google_bigquery_dataset.analytics.self_link
}

output "vpc_network_id" {
  description = "VPC network ID"
  value       = google_compute_network.main.id
}

output "vpc_network_name" {
  description = "VPC network name"
  value       = google_compute_network.main.name
}

output "serverless_connector_id" {
  description = "Serverless VPC connector ID for Cloud Run / Cloud Functions"
  value       = google_vpc_access_connector.serverless.id
}

output "service_account_cloud_run" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
}

output "service_account_connector" {
  description = "Cloud Functions connector service account email"
  value       = google_service_account.connector.email
}

output "service_account_vertex_ai" {
  description = "Vertex AI service account email"
  value       = var.enable_vertex_ai ? google_service_account.vertex_ai[0].email : null
}

output "data_lake_bucket" {
  description = "Data lake GCS bucket name"
  value       = google_storage_bucket.data_lake.name
}

output "ml_artifacts_bucket" {
  description = "ML artifacts GCS bucket name"
  value       = google_storage_bucket.ml_artifacts.name
}

output "staging_bucket" {
  description = "Staging GCS bucket name"
  value       = google_storage_bucket.staging.name
}

output "pubsub_topics" {
  description = "Map of Pub/Sub topic names to their IDs"
  value       = { for k, v in google_pubsub_topic.main : k => v.id }
}

output "kms_key_ring_id" {
  description = "KMS key ring ID"
  value       = google_kms_key_ring.main.id
}

output "cloud_armor_policy_id" {
  description = "Cloud Armor WAF security policy ID"
  value       = google_compute_security_policy.waf.id
}

output "db_password_secret_id" {
  description = "Secret Manager secret ID for the database password"
  value       = google_secret_manager_secret.db_password.secret_id
}
