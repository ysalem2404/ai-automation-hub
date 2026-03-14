# =============================================================================
# Pub/Sub Topics and Subscriptions
# =============================================================================

locals {
  pubsub_topics = {
    connector-events = {
      description = "Events from integration connectors (ACC, Aconex, P6, ERP, ServiceNow)"
      ack_deadline = 60
    }
    agent-tasks = {
      description = "Task queue for AI agent orchestration"
      ack_deadline = 300
    }
    system-notifications = {
      description = "System-wide notifications and alerts"
      ack_deadline = 30
    }
    data-ingestion = {
      description = "Data ingestion pipeline events for BigQuery and Feature Store"
      ack_deadline = 120
    }
  }
}

# =============================================================================
# Dead Letter Topics
# =============================================================================

resource "google_pubsub_topic" "dead_letter" {
  for_each = local.pubsub_topics

  name = "${local.name_prefix}-${each.key}-dlq-${local.name_suffix}"

  labels = local.common_labels

  message_retention_duration = "604800s" # 7 days

  depends_on = [google_project_service.apis["pubsub.googleapis.com"]]
}

# =============================================================================
# Main Topics
# =============================================================================

resource "google_pubsub_topic" "main" {
  for_each = local.pubsub_topics

  name = "${local.name_prefix}-${each.key}-${local.name_suffix}"

  labels = local.common_labels

  message_retention_duration = "86400s" # 1 day

  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }

  depends_on = [google_project_service.apis["pubsub.googleapis.com"]]
}

# =============================================================================
# Subscriptions
# =============================================================================

resource "google_pubsub_subscription" "main" {
  for_each = local.pubsub_topics

  name  = "${local.name_prefix}-${each.key}-sub-${local.name_suffix}"
  topic = google_pubsub_topic.main[each.key].id

  ack_deadline_seconds       = each.value.ack_deadline
  message_retention_duration = "604800s" # 7 days
  retain_acked_messages      = false

  expiration_policy {
    ttl = "" # never expires
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter[each.key].id
    max_delivery_attempts = 5
  }

  labels = local.common_labels
}

# =============================================================================
# IAM — Allow Pub/Sub to publish to dead letter topics
# =============================================================================

data "google_project" "current" {}

resource "google_pubsub_topic_iam_member" "dead_letter_publisher" {
  for_each = local.pubsub_topics

  topic  = google_pubsub_topic.dead_letter[each.key].name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_pubsub_subscription_iam_member" "dead_letter_subscriber" {
  for_each = local.pubsub_topics

  subscription = google_pubsub_subscription.main[each.key].name
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}
