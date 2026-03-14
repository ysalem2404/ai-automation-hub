# =============================================================================
# Notification Channel
# =============================================================================

resource "google_monitoring_notification_channel" "email" {
  display_name = "AI Ops Hub - Email Alerts (${var.environment})"
  type         = "email"

  labels = {
    email_address = var.notification_email
  }

  depends_on = [google_project_service.apis["monitoring.googleapis.com"]]
}

# =============================================================================
# Uptime Check — Cloud Run Portal
# =============================================================================

resource "google_monitoring_uptime_check_config" "portal" {
  display_name = "${local.name_prefix}-portal-uptime-${local.name_suffix}"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "cloud_run_revision"
    labels = {
      project_id         = var.project_id
      service_name       = google_cloud_run_v2_service.portal.name
      location           = var.region
      configuration_name = ""
      revision_name      = ""
    }
  }

  depends_on = [google_project_service.apis["monitoring.googleapis.com"]]
}

# =============================================================================
# Alert Policy — Portal Uptime Failure
# =============================================================================

resource "google_monitoring_alert_policy" "portal_uptime" {
  display_name = "[${upper(var.environment)}] AI Ops Portal — Uptime Failure"
  combiner     = "OR"

  conditions {
    display_name = "Portal uptime check failed"
    condition_threshold {
      filter          = "resource.type = \"uptime_url\" AND metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.labels.check_id = \"${google_monitoring_uptime_check_config.portal.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "300s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_NEXT_OLDER"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "The AI Ops Portal health check has failed. Check Cloud Run logs: https://console.cloud.google.com/run/detail/${var.region}/${google_cloud_run_v2_service.portal.name}/logs?project=${var.project_id}"
    mime_type = "text/markdown"
  }

  user_labels = local.common_labels
}

# =============================================================================
# Alert Policy — Cloud Run High Latency (p99 > 5s)
# =============================================================================

resource "google_monitoring_alert_policy" "portal_latency" {
  display_name = "[${upper(var.environment)}] AI Ops Portal — High Latency"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run request latency p99 > 5s"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.portal.name}\" AND metric.type = \"run.googleapis.com/request_latencies\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5000
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MAX"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "The AI Ops Portal p99 latency has exceeded 5 seconds. Investigate: https://console.cloud.google.com/run/detail/${var.region}/${google_cloud_run_v2_service.portal.name}/metrics?project=${var.project_id}"
    mime_type = "text/markdown"
  }

  user_labels = local.common_labels
}

# =============================================================================
# Alert Policy — Cloud Run Error Rate > 5%
# =============================================================================

resource "google_monitoring_alert_policy" "portal_errors" {
  display_name = "[${upper(var.environment)}] AI Ops Portal — High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run 5xx error rate > 5%"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.portal.name}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "The AI Ops Portal 5xx error rate has exceeded 5%. Check logs: https://console.cloud.google.com/run/detail/${var.region}/${google_cloud_run_v2_service.portal.name}/logs?project=${var.project_id}"
    mime_type = "text/markdown"
  }

  user_labels = local.common_labels
}

# =============================================================================
# Alert Policy — Cloud SQL CPU > 80%
# =============================================================================

resource "google_monitoring_alert_policy" "db_cpu" {
  display_name = "[${upper(var.environment)}] Cloud SQL — High CPU Utilization"
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL CPU utilization > 80%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND resource.labels.database_id = \"${var.project_id}:${google_sql_database_instance.main.name}\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MAX"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "Cloud SQL instance CPU utilization is above 80%. Consider scaling up the instance tier or optimizing queries."
    mime_type = "text/markdown"
  }

  user_labels = local.common_labels
}

# =============================================================================
# Log-based Metric — Application Errors
# =============================================================================

resource "google_logging_metric" "app_errors" {
  name        = "${local.name_prefix}-app-errors-${local.name_suffix}"
  description = "Count of application-level errors in Cloud Run logs"
  filter      = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.portal.name}\" AND severity>=ERROR"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"

    labels {
      key         = "severity"
      value_type  = "STRING"
      description = "Log severity level"
    }
  }

  label_extractors = {
    "severity" = "EXTRACT(severity)"
  }
}

# =============================================================================
# Dashboard (placeholder — use JSON definition for complex dashboards)
# =============================================================================

resource "google_monitoring_dashboard" "overview" {
  dashboard_json = jsonencode({
    displayName = "AI Ops Hub Overview (${var.environment})"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Cloud Run — Request Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.portal.name}\" AND metric.type = \"run.googleapis.com/request_count\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Cloud Run — Request Latency (p50, p95, p99)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${google_cloud_run_v2_service.portal.name}\" AND metric.type = \"run.googleapis.com/request_latencies\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_PERCENTILE_99"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Cloud SQL — CPU Utilization"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Cloud SQL — Active Connections"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/postgresql/num_backends\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        },
      ]
    }
  })

  depends_on = [google_project_service.apis["monitoring.googleapis.com"]]
}
