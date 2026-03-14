# =============================================================================
# Cloud Storage Buckets
# =============================================================================

# -----------------------------------------------------------------------------
# Data Lake — raw and processed data from connectors
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "data_lake" {
  name     = "${local.name_prefix}-data-lake-${local.name_suffix}"
  location = var.region

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = var.environment != "prod"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age                = 30
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis["storage.googleapis.com"]]
}

# -----------------------------------------------------------------------------
# ML Artifacts — model checkpoints, training data, experiment outputs
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "ml_artifacts" {
  name     = "${local.name_prefix}-ml-artifacts-${local.name_suffix}"
  location = var.region

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = var.environment != "prod"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age                = 60
      num_newer_versions = 5
    }
    action {
      type = "Delete"
    }
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis["storage.googleapis.com"]]
}

# -----------------------------------------------------------------------------
# Staging / Temp — ephemeral data for ETL, imports, and temporary processing
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "staging" {
  name     = "${local.name_prefix}-staging-${local.name_suffix}"
  location = var.region

  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = true

  versioning {
    enabled = false
  }

  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis["storage.googleapis.com"]]
}

# =============================================================================
# Bucket IAM
# =============================================================================

resource "google_storage_bucket_iam_member" "data_lake_connector_write" {
  bucket = google_storage_bucket.data_lake.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.connector.email}"
}

resource "google_storage_bucket_iam_member" "data_lake_run_read" {
  bucket = google_storage_bucket.data_lake.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "ml_artifacts_vertex" {
  count = var.enable_vertex_ai ? 1 : 0

  bucket = google_storage_bucket.ml_artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vertex_ai[0].email}"
}

resource "google_storage_bucket_iam_member" "staging_connector_write" {
  bucket = google_storage_bucket.staging.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.connector.email}"
}
