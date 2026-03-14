# =============================================================================
# Cloud Functions (2nd Gen) — Integration Connectors
# =============================================================================

# Service account for all connector functions (least-privilege)
resource "google_service_account" "connector" {
  account_id   = "${local.name_prefix}-connectors-${local.name_suffix}"
  display_name = "Cloud Functions Connector SA (${var.environment})"
}

resource "google_project_iam_member" "connector_roles" {
  for_each = toset([
    "roles/pubsub.subscriber",
    "roles/pubsub.publisher",
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.connector.email}"
}

# =============================================================================
# Source code placeholder bucket
# =============================================================================

resource "google_storage_bucket" "functions_source" {
  name     = "${local.name_prefix}-functions-src-${local.name_suffix}"
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = true

  versioning {
    enabled = true
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis["storage.googleapis.com"]]
}

# =============================================================================
# Cloud Functions — one per connector
# =============================================================================

resource "google_cloudfunctions2_function" "connector" {
  for_each = var.connector_functions

  name        = "${local.name_prefix}-${each.key}-${local.name_suffix}"
  location    = var.region
  description = each.value.description

  build_config {
    runtime     = "python312"
    entry_point = each.value.entry_point

    source {
      storage_source {
        bucket = google_storage_bucket.functions_source.name
        object = "${each.key}/source.zip"
      }
    }
  }

  service_config {
    available_memory   = "${each.value.memory_mb}M"
    timeout_seconds    = each.value.timeout_s
    max_instance_count = var.environment == "prod" ? 10 : 3
    min_instance_count = 0

    service_account_email = google_service_account.connector.email

    vpc_connector                 = google_vpc_access_connector.serverless.id
    vpc_connector_egress_settings = "PRIVATE_RANGES_ONLY"

    environment_variables = {
      PROJECT_ID  = var.project_id
      ENVIRONMENT = var.environment
      REGION      = var.region
    }

    secret_environment_variables {
      key        = "DB_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.db_password.secret_id
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.main["connector-events"].id
    retry_policy   = "RETRY_POLICY_RETRY"
  }

  labels = merge(local.common_labels, {
    connector = each.key
  })

  depends_on = [
    google_project_service.apis["cloudfunctions.googleapis.com"],
    google_project_service.apis["cloudbuild.googleapis.com"],
  ]

  lifecycle {
    ignore_changes = [
      build_config[0].source[0].storage_source[0].generation,
    ]
  }
}
