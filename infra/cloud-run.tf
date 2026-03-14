# =============================================================================
# Cloud Run — AI Ops Portal (React frontend + API)
# =============================================================================

resource "google_cloud_run_v2_service" "portal" {
  name     = "${local.name_prefix}-ai-ops-portal-${local.name_suffix}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.serverless.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.cloud_run.email

    containers {
      image = var.portal_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "REGION"
        value = var.region
      }

      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.analytics.dataset_id
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_connection_url.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds = 30
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_version.db_connection_url,
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# =============================================================================
# IAM — Allow unauthenticated access (public portal)
# Set to allUsers for public access; replace with specific members for auth'd access
# =============================================================================

resource "google_cloud_run_v2_service_iam_member" "portal_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.portal.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# =============================================================================
# Custom Domain Mapping (optional)
# =============================================================================

resource "google_cloud_run_domain_mapping" "portal" {
  count    = var.domain_name != "" ? 1 : 0
  location = var.region
  name     = var.domain_name

  metadata {
    namespace = var.project_id
    labels    = local.common_labels
  }

  spec {
    route_name = google_cloud_run_v2_service.portal.name
  }

  depends_on = [google_cloud_run_v2_service.portal]
}

# =============================================================================
# Service Account for Cloud Run
# =============================================================================

resource "google_service_account" "cloud_run" {
  account_id   = "${local.name_prefix}-run-${local.name_suffix}"
  display_name = "Cloud Run AI Ops Portal (${var.environment})"
}

resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/bigquery.dataViewer",
    "roles/bigquery.jobUser",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
    "roles/storage.objectViewer",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}
