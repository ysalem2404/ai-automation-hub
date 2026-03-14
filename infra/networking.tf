# =============================================================================
# VPC Network
# =============================================================================

resource "google_compute_network" "main" {
  name                    = "${local.name_prefix}-vpc-${local.name_suffix}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  depends_on = [google_project_service.apis["compute.googleapis.com"]]
}

# =============================================================================
# Subnets
# =============================================================================

resource "google_compute_subnetwork" "private" {
  name                     = "${local.name_prefix}-private-subnet-${local.name_suffix}"
  ip_cidr_range            = "10.0.1.0/24"
  region                   = var.region
  network                  = google_compute_network.main.id
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_subnetwork" "serverless" {
  name                     = "${local.name_prefix}-serverless-subnet-${local.name_suffix}"
  ip_cidr_range            = "10.0.2.0/28"
  region                   = var.region
  network                  = google_compute_network.main.id
  private_ip_google_access = true
}

# =============================================================================
# Cloud NAT (outbound internet for private resources)
# =============================================================================

resource "google_compute_router" "main" {
  name    = "${local.name_prefix}-router-${local.name_suffix}"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name                               = "${local.name_prefix}-nat-${local.name_suffix}"
  router                             = google_compute_router.main.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# =============================================================================
# Serverless VPC Connector (Cloud Run → VPC)
# =============================================================================

resource "google_vpc_access_connector" "serverless" {
  name          = "${local.name_prefix}-connector"
  region        = var.region
  network       = google_compute_network.main.name
  ip_cidr_range = "10.0.3.0/28"
  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.apis["vpcaccess.googleapis.com"]]
}

# =============================================================================
# Private Services Access (Cloud SQL private IP)
# =============================================================================

resource "google_compute_global_address" "private_services" {
  name          = "${local.name_prefix}-private-svc-range-${local.name_suffix}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_services" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]

  depends_on = [google_project_service.apis["servicenetworking.googleapis.com"]]
}

# =============================================================================
# Firewall Rules
# =============================================================================

resource "google_compute_firewall" "deny_all_ingress" {
  name        = "${local.name_prefix}-deny-all-ingress-${local.name_suffix}"
  network     = google_compute_network.main.name
  direction   = "INGRESS"
  priority    = 65534
  description = "Default deny all ingress traffic"

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_internal" {
  name        = "${local.name_prefix}-allow-internal-${local.name_suffix}"
  network     = google_compute_network.main.name
  direction   = "INGRESS"
  priority    = 1000
  description = "Allow internal traffic between VPC resources"

  allow {
    protocol = "tcp"
  }

  allow {
    protocol = "udp"
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
}

resource "google_compute_firewall" "allow_health_checks" {
  name        = "${local.name_prefix}-allow-health-checks-${local.name_suffix}"
  network     = google_compute_network.main.name
  direction   = "INGRESS"
  priority    = 1000
  description = "Allow GCP health check probes"

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  # Google health check IP ranges
  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

resource "google_compute_firewall" "allow_iap" {
  name        = "${local.name_prefix}-allow-iap-${local.name_suffix}"
  network     = google_compute_network.main.name
  direction   = "INGRESS"
  priority    = 1000
  description = "Allow Identity-Aware Proxy for secure SSH/RDP"

  allow {
    protocol = "tcp"
    ports    = ["22", "3389"]
  }

  # IAP IP range
  source_ranges = ["35.235.240.0/20"]
}
