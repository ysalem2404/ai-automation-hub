# =============================================================================
# Cloud SQL — PostgreSQL 15
# =============================================================================

resource "google_sql_database_instance" "main" {
  name                = "${local.name_prefix}-db-${local.name_suffix}"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = var.environment == "prod"

  settings {
    tier              = var.db_tier
    availability_type = var.db_availability_type
    disk_autoresize   = true
    disk_size         = 10
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = var.environment == "prod"
      transaction_log_retention_days = var.environment == "prod" ? 7 : 1

      backup_retention_settings {
        retained_backups = var.environment == "prod" ? 30 : 7
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 4
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = false
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    user_labels = local.common_labels
  }

  depends_on = [
    google_service_networking_connection.private_services,
    google_project_service.apis["sqladmin.googleapis.com"],
  ]

  lifecycle {
    prevent_destroy = false
  }
}

# =============================================================================
# Database
# =============================================================================

resource "google_sql_database" "ai_ops_hub" {
  name     = "ai_ops_hub"
  instance = google_sql_database_instance.main.name
}

# =============================================================================
# Database User with Random Password
# =============================================================================

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "google_sql_user" "app_user" {
  name     = "ai_ops_app"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result

  deletion_policy = "ABANDON"
}

# =============================================================================
# Store DB credentials in Secret Manager
# =============================================================================

resource "google_secret_manager_secret" "db_password" {
  secret_id = "${local.name_prefix}-db-password-${local.name_suffix}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis["secretmanager.googleapis.com"]]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

resource "google_secret_manager_secret" "db_connection_url" {
  secret_id = "${local.name_prefix}-db-url-${local.name_suffix}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis["secretmanager.googleapis.com"]]
}

resource "google_secret_manager_secret_version" "db_connection_url" {
  secret      = google_secret_manager_secret.db_connection_url.id
  secret_data = "postgresql://${google_sql_user.app_user.name}:${random_password.db_password.result}@/${google_sql_database.ai_ops_hub.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
}
