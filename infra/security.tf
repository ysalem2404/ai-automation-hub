# =============================================================================
# Cloud KMS — Encryption Key Management
# =============================================================================

resource "google_kms_key_ring" "main" {
  name     = "${local.name_prefix}-keyring-${local.name_suffix}"
  location = var.region

  depends_on = [google_project_service.apis["cloudkms.googleapis.com"]]
}

resource "google_kms_crypto_key" "data_encryption" {
  name            = "${local.name_prefix}-data-key-${local.name_suffix}"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days
  purpose         = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "google_kms_crypto_key" "secrets_encryption" {
  name            = "${local.name_prefix}-secrets-key-${local.name_suffix}"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days
  purpose         = "ENCRYPT_DECRYPT"

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "SOFTWARE"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# =============================================================================
# Secret Manager — Application Secrets
# =============================================================================

resource "google_secret_manager_secret" "api_keys" {
  for_each = toset([
    "${local.name_prefix}-acc-api-key-${local.name_suffix}",
    "${local.name_prefix}-aconex-api-key-${local.name_suffix}",
    "${local.name_prefix}-p6-api-key-${local.name_suffix}",
    "${local.name_prefix}-erp-api-key-${local.name_suffix}",
    "${local.name_prefix}-servicenow-api-key-${local.name_suffix}",
  ])

  secret_id = each.value

  replication {
    auto {}
  }

  labels = local.common_labels

  depends_on = [google_project_service.apis["secretmanager.googleapis.com"]]
}

# =============================================================================
# Cloud Armor — WAF and DDoS Protection
# =============================================================================

resource "google_compute_security_policy" "waf" {
  name        = "${local.name_prefix}-waf-policy-${local.name_suffix}"
  description = "Cloud Armor WAF policy for AI Ops Portal"

  # Default rule: allow
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }

  # Block known bad IPs / threat intelligence
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluateThreatIntelligence('iplist-known-malicious-ips')"
      }
    }
    description = "Block known malicious IPs"
  }

  # Rate limiting
  rule {
    action   = "rate_based_ban"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 1000
        interval_sec = 60
      }
      ban_duration_sec = 600
    }
    description = "Rate limit: 1000 req/min per IP"
  }

  # SQL injection protection
  rule {
    action   = "deny(403)"
    priority = "3000"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 2})"
      }
    }
    description = "Block SQL injection attempts"
  }

  # XSS protection
  rule {
    action   = "deny(403)"
    priority = "3100"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 2})"
      }
    }
    description = "Block cross-site scripting attempts"
  }

  # Remote Code Execution protection
  rule {
    action   = "deny(403)"
    priority = "3200"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('rce-v33-stable', {'sensitivity': 2})"
      }
    }
    description = "Block remote code execution attempts"
  }

  # Local File Inclusion protection
  rule {
    action   = "deny(403)"
    priority = "3300"
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('lfi-v33-stable', {'sensitivity': 2})"
      }
    }
    description = "Block local file inclusion attempts"
  }

  depends_on = [google_project_service.apis["compute.googleapis.com"]]
}

# =============================================================================
# Org-level Security — Audit Logging
# =============================================================================

resource "google_project_iam_audit_config" "all_services" {
  project = var.project_id
  service = "allServices"

  audit_log_config {
    log_type = "ADMIN_READ"
  }

  audit_log_config {
    log_type = "DATA_READ"
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}
