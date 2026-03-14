# =============================================================================
# Vertex AI — APIs, Service Account, and Feature Store
# =============================================================================
#
# NOTE: Vertex AI Agent Engine (formerly Reasoning Engine) and RAG Engine
# are configured via the Vertex AI SDK / Agent Development Kit (ADK), not
# Terraform. After infrastructure is provisioned:
#
#   1. Install the ADK:  pip install google-adk
#   2. Configure agents in code using vertexai.agent_engines
#   3. Deploy agents:    adk deploy cloud_run --project=thasaa-blue
#   4. RAG corpora are created via the vertexai.rag module
#
# See: https://cloud.google.com/vertex-ai/docs/agent-engine/overview
# =============================================================================

# Enable Vertex AI APIs (conditional)
resource "google_project_service" "vertex_ai_apis" {
  for_each = var.enable_vertex_ai ? toset([
    "aiplatform.googleapis.com",
    "notebooks.googleapis.com",
    "ml.googleapis.com",
  ]) : toset([])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# =============================================================================
# Service Account for Vertex AI workloads
# =============================================================================

resource "google_service_account" "vertex_ai" {
  count = var.enable_vertex_ai ? 1 : 0

  account_id   = "${local.name_prefix}-vertex-${local.name_suffix}"
  display_name = "Vertex AI Service Account (${var.environment})"
}

resource "google_project_iam_member" "vertex_ai_roles" {
  for_each = var.enable_vertex_ai ? toset([
    "roles/aiplatform.user",
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/pubsub.publisher",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ]) : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vertex_ai[0].email}"
}

# =============================================================================
# Vertex AI Feature Store
# =============================================================================

resource "google_vertex_ai_featurestore" "main" {
  count = var.enable_vertex_ai ? 1 : 0

  provider = google-beta
  name     = replace("${local.name_prefix}_featurestore_${local.name_suffix}", "-", "_")
  region   = var.region

  online_serving_config {
    fixed_node_count = var.environment == "prod" ? 2 : 1
  }

  force_destroy = var.environment != "prod"

  labels = local.common_labels

  depends_on = [google_project_service.vertex_ai_apis["aiplatform.googleapis.com"]]
}

# Feature Store entity: project_context (for real-time project feature serving)
resource "google_vertex_ai_featurestore_entitytype" "project_context" {
  count = var.enable_vertex_ai ? 1 : 0

  provider     = google-beta
  name         = "project_context"
  featurestore = google_vertex_ai_featurestore.main[0].id
  description  = "Project-level context features for AI agent decision-making"

  monitoring_config {
    snapshot_analysis {
      disabled = false
    }
  }

  labels = local.common_labels
}

resource "google_vertex_ai_featurestore_entitytype_feature" "risk_score" {
  count = var.enable_vertex_ai ? 1 : 0

  provider   = google-beta
  name       = "current_risk_score"
  entitytype = google_vertex_ai_featurestore_entitytype.project_context[0].id
  value_type = "DOUBLE"

  labels = local.common_labels
}

resource "google_vertex_ai_featurestore_entitytype_feature" "schedule_variance" {
  count = var.enable_vertex_ai ? 1 : 0

  provider   = google-beta
  name       = "schedule_variance_days"
  entitytype = google_vertex_ai_featurestore_entitytype.project_context[0].id
  value_type = "DOUBLE"

  labels = local.common_labels
}

resource "google_vertex_ai_featurestore_entitytype_feature" "cost_variance_pct" {
  count = var.enable_vertex_ai ? 1 : 0

  provider   = google-beta
  name       = "cost_variance_pct"
  entitytype = google_vertex_ai_featurestore_entitytype.project_context[0].id
  value_type = "DOUBLE"

  labels = local.common_labels
}
