variable "project_id" {
  description = "GCP project ID for the Thasaa Blue AI Operations Hub"
  type        = string
  default     = "thasaa-blue"
}

variable "region" {
  description = "GCP region for resource deployment"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "portal_image" {
  description = "Container image for the AI Ops Portal Cloud Run service (e.g., us-docker.pkg.dev/thasaa-blue/ai-ops/portal:latest)"
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL instance tier. Use db-f1-micro for dev, db-custom-2-7680 or higher for prod."
  type        = string
  default     = "db-f1-micro"
}

variable "enable_vertex_ai" {
  description = "Enable Vertex AI resources (Feature Store, service accounts, API enablement)"
  type        = bool
  default     = true
}

variable "notification_email" {
  description = "Email address for monitoring alert notifications"
  type        = string
  default     = "ops@thasaa.com"
}

variable "domain_name" {
  description = "Custom domain for the AI Ops Portal (leave empty to skip domain mapping)"
  type        = string
  default     = ""
}

variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances (set >0 for prod to avoid cold starts)"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances for auto-scaling"
  type        = number
  default     = 10
}

variable "db_availability_type" {
  description = "Cloud SQL availability type. Use ZONAL for dev, REGIONAL for prod."
  type        = string
  default     = "ZONAL"

  validation {
    condition     = contains(["ZONAL", "REGIONAL"], var.db_availability_type)
    error_message = "Availability type must be ZONAL or REGIONAL."
  }
}

variable "connector_functions" {
  description = "Map of integration connector Cloud Functions to deploy"
  type = map(object({
    description = string
    entry_point = string
    memory_mb   = optional(number, 256)
    timeout_s   = optional(number, 120)
  }))
  default = {
    acc-connector = {
      description = "ACC system integration connector"
      entry_point = "handle_acc_event"
    }
    aconex-connector = {
      description = "Aconex document management connector"
      entry_point = "handle_aconex_event"
    }
    p6-connector = {
      description = "Primavera P6 scheduling connector"
      entry_point = "handle_p6_event"
    }
    erp-connector = {
      description = "ERP system integration connector"
      entry_point = "handle_erp_event"
    }
    servicenow-connector = {
      description = "ServiceNow ITSM connector"
      entry_point = "handle_servicenow_event"
    }
  }
}
