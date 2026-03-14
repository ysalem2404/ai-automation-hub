# =============================================================================
# BigQuery Dataset — AI Ops Analytics
# =============================================================================

resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "ai_ops_analytics"
  friendly_name = "AI Ops Analytics"
  description   = "Analytics dataset for the AI Operations Hub — risk, cost, schedule, and BIM data"
  location      = var.region

  default_table_expiration_ms     = null
  default_partition_expiration_ms = null
  delete_contents_on_destroy      = var.environment != "prod"

  labels = local.common_labels

  access {
    role          = "OWNER"
    special_group = "projectOwners"
  }

  access {
    role          = "WRITER"
    user_by_email = google_service_account.cloud_run.email
  }

  access {
    role          = "READER"
    user_by_email = google_service_account.vertex_ai[0].email
  }

  depends_on = [google_project_service.apis["bigquery.googleapis.com"]]
}

# =============================================================================
# Table: project_risks
# =============================================================================

resource "google_bigquery_table" "project_risks" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "project_risks"
  description         = "Aggregated project risk assessments and scores"
  deletion_protection = var.environment == "prod"

  time_partitioning {
    type  = "DAY"
    field = "assessed_at"
  }

  clustering = ["project_code", "risk_category"]

  labels = local.common_labels

  schema = jsonencode([
    { name = "risk_id", type = "STRING", mode = "REQUIRED", description = "Unique risk identifier" },
    { name = "project_code", type = "STRING", mode = "REQUIRED", description = "Project code reference" },
    { name = "risk_category", type = "STRING", mode = "REQUIRED", description = "Category: schedule, cost, safety, quality, environmental" },
    { name = "risk_title", type = "STRING", mode = "REQUIRED", description = "Short risk title" },
    { name = "description", type = "STRING", mode = "NULLABLE", description = "Detailed risk description" },
    { name = "probability", type = "FLOAT64", mode = "REQUIRED", description = "Probability score 0.0-1.0" },
    { name = "impact", type = "FLOAT64", mode = "REQUIRED", description = "Impact score 0.0-1.0" },
    { name = "risk_score", type = "FLOAT64", mode = "REQUIRED", description = "Composite risk score (probability × impact)" },
    { name = "mitigation_status", type = "STRING", mode = "NULLABLE", description = "Status: identified, mitigating, accepted, resolved" },
    { name = "owner", type = "STRING", mode = "NULLABLE", description = "Risk owner email" },
    { name = "assessed_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Assessment timestamp" },
    { name = "updated_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Last update timestamp" },
  ])
}

# =============================================================================
# Table: cost_forecasts
# =============================================================================

resource "google_bigquery_table" "cost_forecasts" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "cost_forecasts"
  description         = "Cost forecasting data and variance analysis"
  deletion_protection = var.environment == "prod"

  time_partitioning {
    type  = "MONTH"
    field = "forecast_date"
  }

  clustering = ["project_code", "cost_category"]

  labels = local.common_labels

  schema = jsonencode([
    { name = "forecast_id", type = "STRING", mode = "REQUIRED", description = "Unique forecast identifier" },
    { name = "project_code", type = "STRING", mode = "REQUIRED", description = "Project code reference" },
    { name = "cost_category", type = "STRING", mode = "REQUIRED", description = "Cost category: labor, materials, equipment, subcontract, overhead" },
    { name = "budget_amount", type = "NUMERIC", mode = "REQUIRED", description = "Original budget amount" },
    { name = "actual_amount", type = "NUMERIC", mode = "NULLABLE", description = "Actual spend to date" },
    { name = "forecast_amount", type = "NUMERIC", mode = "REQUIRED", description = "Forecasted total cost" },
    { name = "variance", type = "NUMERIC", mode = "NULLABLE", description = "Variance from budget" },
    { name = "variance_pct", type = "FLOAT64", mode = "NULLABLE", description = "Variance percentage" },
    { name = "confidence_level", type = "FLOAT64", mode = "NULLABLE", description = "Forecast confidence 0.0-1.0" },
    { name = "forecast_date", type = "DATE", mode = "REQUIRED", description = "Forecast period date" },
    { name = "generated_at", type = "TIMESTAMP", mode = "REQUIRED", description = "When forecast was generated" },
  ])
}

# =============================================================================
# Table: rfi_tracking
# =============================================================================

resource "google_bigquery_table" "rfi_tracking" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "rfi_tracking"
  description         = "Request for Information tracking and response metrics"
  deletion_protection = var.environment == "prod"

  time_partitioning {
    type  = "DAY"
    field = "submitted_at"
  }

  clustering = ["project_code", "status"]

  labels = local.common_labels

  schema = jsonencode([
    { name = "rfi_id", type = "STRING", mode = "REQUIRED", description = "Unique RFI identifier" },
    { name = "rfi_number", type = "STRING", mode = "REQUIRED", description = "Human-readable RFI number" },
    { name = "project_code", type = "STRING", mode = "REQUIRED", description = "Project code reference" },
    { name = "subject", type = "STRING", mode = "REQUIRED", description = "RFI subject line" },
    { name = "description", type = "STRING", mode = "NULLABLE", description = "Detailed RFI description" },
    { name = "status", type = "STRING", mode = "REQUIRED", description = "Status: draft, submitted, in_review, answered, closed" },
    { name = "priority", type = "STRING", mode = "NULLABLE", description = "Priority: low, medium, high, critical" },
    { name = "submitted_by", type = "STRING", mode = "NULLABLE", description = "Submitter email" },
    { name = "assigned_to", type = "STRING", mode = "NULLABLE", description = "Assignee email" },
    { name = "submitted_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Submission timestamp" },
    { name = "due_date", type = "DATE", mode = "NULLABLE", description = "Response due date" },
    { name = "responded_at", type = "TIMESTAMP", mode = "NULLABLE", description = "Response timestamp" },
    { name = "response_days", type = "INT64", mode = "NULLABLE", description = "Days to respond" },
    { name = "source_system", type = "STRING", mode = "NULLABLE", description = "Originating system (Aconex, ACC, etc.)" },
  ])
}

# =============================================================================
# Table: schedule_data
# =============================================================================

resource "google_bigquery_table" "schedule_data" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "schedule_data"
  description         = "Project schedule activities imported from P6 and other scheduling tools"
  deletion_protection = var.environment == "prod"

  time_partitioning {
    type  = "DAY"
    field = "data_date"
  }

  clustering = ["project_code", "wbs_code"]

  labels = local.common_labels

  schema = jsonencode([
    { name = "activity_id", type = "STRING", mode = "REQUIRED", description = "Unique activity identifier" },
    { name = "project_code", type = "STRING", mode = "REQUIRED", description = "Project code reference" },
    { name = "wbs_code", type = "STRING", mode = "REQUIRED", description = "Work breakdown structure code" },
    { name = "activity_name", type = "STRING", mode = "REQUIRED", description = "Activity name" },
    { name = "planned_start", type = "DATE", mode = "NULLABLE", description = "Planned start date" },
    { name = "planned_finish", type = "DATE", mode = "NULLABLE", description = "Planned finish date" },
    { name = "actual_start", type = "DATE", mode = "NULLABLE", description = "Actual start date" },
    { name = "actual_finish", type = "DATE", mode = "NULLABLE", description = "Actual finish date" },
    { name = "percent_complete", type = "FLOAT64", mode = "NULLABLE", description = "Completion percentage 0-100" },
    { name = "total_float", type = "FLOAT64", mode = "NULLABLE", description = "Total float in days" },
    { name = "is_critical", type = "BOOL", mode = "NULLABLE", description = "Whether activity is on critical path" },
    { name = "status", type = "STRING", mode = "NULLABLE", description = "Status: not_started, in_progress, completed" },
    { name = "data_date", type = "DATE", mode = "REQUIRED", description = "Schedule data date (snapshot)" },
    { name = "source_system", type = "STRING", mode = "NULLABLE", description = "Source scheduling system" },
  ])
}

# =============================================================================
# Table: bim_metadata
# =============================================================================

resource "google_bigquery_table" "bim_metadata" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "bim_metadata"
  description         = "Building Information Model metadata and element properties"
  deletion_protection = var.environment == "prod"

  time_partitioning {
    type  = "DAY"
    field = "ingested_at"
  }

  clustering = ["project_code", "element_category"]

  labels = local.common_labels

  schema = jsonencode([
    { name = "element_id", type = "STRING", mode = "REQUIRED", description = "BIM element unique identifier" },
    { name = "project_code", type = "STRING", mode = "REQUIRED", description = "Project code reference" },
    { name = "model_name", type = "STRING", mode = "REQUIRED", description = "BIM model name" },
    { name = "model_version", type = "STRING", mode = "NULLABLE", description = "Model version" },
    { name = "element_category", type = "STRING", mode = "REQUIRED", description = "Element category: structural, architectural, MEP, civil" },
    { name = "element_type", type = "STRING", mode = "NULLABLE", description = "Element type (e.g., beam, column, wall, pipe)" },
    { name = "element_name", type = "STRING", mode = "NULLABLE", description = "Element name" },
    { name = "level", type = "STRING", mode = "NULLABLE", description = "Building level/floor" },
    { name = "zone", type = "STRING", mode = "NULLABLE", description = "Zone or area within level" },
    { name = "material", type = "STRING", mode = "NULLABLE", description = "Primary material" },
    { name = "properties", type = "JSON", mode = "NULLABLE", description = "Extended properties as JSON" },
    { name = "clash_count", type = "INT64", mode = "NULLABLE", description = "Number of active clashes involving this element" },
    { name = "ingested_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Data ingestion timestamp" },
    { name = "source_file", type = "STRING", mode = "NULLABLE", description = "Source file path or URI" },
  ])
}
