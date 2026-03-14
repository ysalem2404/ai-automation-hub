# Thasaa Blue — AI Operations Hub Infrastructure

Terraform infrastructure-as-code for deploying the **AI Operations Hub** platform on Google Cloud Platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Internet                                                           │
│       │                                                             │
│  Cloud Armor (WAF)                                                  │
│       │                                                             │
│  Cloud Run ─── AI Ops Portal (React)                                │
│       │                                                             │
│  ┌────┴──────────────────────────────────────────────────────┐      │
│  │  VPC (Private)                                            │      │
│  │       │                    │                  │            │      │
│  │  Cloud SQL            BigQuery          Vertex AI         │      │
│  │  (PostgreSQL 15)      (Analytics)       (Feature Store)   │      │
│  │       │                    │                  │            │      │
│  │  Cloud Functions ─── Pub/Sub ─── Cloud Storage            │      │
│  │  (Connectors)        (Events)    (Data Lake)              │      │
│  │       │                                                   │      │
│  │  ACC │ Aconex │ P6 │ ERP │ ServiceNow                    │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                     │
│  Secret Manager │ Cloud KMS │ Cloud Monitoring                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Resources Deployed

| Resource | Purpose |
|----------|---------|
| **Cloud Run** | AI Ops Portal — React frontend and API |
| **Cloud SQL** | PostgreSQL 15 — application database |
| **BigQuery** | Analytics — risk, cost, RFI, schedule, BIM data |
| **Vertex AI** | Feature Store, ML model serving, agent orchestration |
| **Cloud Functions** | Integration connectors (ACC, Aconex, P6, ERP, ServiceNow) |
| **Pub/Sub** | Event-driven messaging between services |
| **Cloud Storage** | Data lake, ML artifacts, staging |
| **Cloud KMS** | Encryption key management |
| **Secret Manager** | Secrets and API key storage |
| **Cloud Armor** | WAF with OWASP protection rules |
| **Cloud Monitoring** | Uptime checks, alerts, dashboards |
| **VPC** | Private networking with Cloud NAT |

## Prerequisites

1. **Terraform** >= 1.5.0 ([install](https://developer.hashicorp.com/terraform/install))
2. **Google Cloud SDK** ([install](https://cloud.google.com/sdk/docs/install))
3. A GCP project with billing enabled
4. Sufficient IAM permissions (Project Owner or equivalent)

## Quick Start

### 1. Authenticate

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project thasaa-blue
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  bigquery.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com \
  cloudkms.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  notebooks.googleapis.com
```

### 3. Create Terraform State Bucket

```bash
gcloud storage buckets create gs://thasaa-blue-terraform-state \
  --location=us-central1 \
  --uniform-bucket-level-access
```

### 4. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 5. Deploy

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Environment Configuration

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| `db_tier` | `db-f1-micro` | `db-custom-2-7680` | `db-custom-4-15360` |
| `db_availability_type` | `ZONAL` | `ZONAL` | `REGIONAL` |
| `cloud_run_min_instances` | `0` | `1` | `2` |
| `cloud_run_max_instances` | `10` | `20` | `50` |
| `enable_vertex_ai` | `true` | `true` | `true` |

## Vertex AI / Agent Setup

Vertex AI Agent Engine and RAG Engine are configured via the SDK, not Terraform. After infrastructure is deployed:

```bash
pip install google-adk google-cloud-aiplatform

# Configure and deploy agents
adk deploy cloud_run --project=thasaa-blue --region=us-central1
```

## Cost Optimization

- **Dev environment**: Uses `db-f1-micro` SQL tier, Cloud Run scales to zero, single-zone deployment
- **Storage lifecycle**: Data lake transitions to Nearline (90d) then Coldline (365d); staging auto-deletes after 7 days
- **Cloud Functions**: Scale to zero when idle; min instances set to 0
- **Feature Store**: Single node in dev; scale for prod
- **Committed use discounts**: Consider for prod Cloud SQL and Compute resources

## File Structure

```
thasaa-blue-infra/
├── main.tf                 # Provider config, API enablement
├── variables.tf            # Input variables with defaults
├── networking.tf           # VPC, subnets, NAT, firewall
├── cloud-run.tf            # AI Ops Portal service
├── database.tf             # Cloud SQL PostgreSQL
├── bigquery.tf             # Analytics dataset and tables
├── vertex-ai.tf            # Vertex AI Feature Store, service account
├── pubsub.tf               # Topics, subscriptions, dead letters
├── cloud-functions.tf      # Integration connector functions
├── storage.tf              # GCS buckets with lifecycle rules
├── security.tf             # KMS, Secret Manager, Cloud Armor
├── monitoring.tf           # Alerts, uptime checks, dashboard
├── outputs.tf              # Exported values
├── terraform.tfvars.example
├── README.md
└── .github/
    └── workflows/
        └── terraform.yml   # CI/CD pipeline
```

## Destroying Resources

```bash
# WARNING: This will destroy all infrastructure
terraform destroy
```

For production, `deletion_protection` is enabled on Cloud SQL and BigQuery tables. You must disable it before destroying:

```bash
terraform apply -var="environment=dev"  # or manually set deletion_protection=false
terraform destroy
```
