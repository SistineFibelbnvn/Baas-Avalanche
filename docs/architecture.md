## Avalanche-Based Layer1 Graduation Project – System Architecture

### 1. Overview
- **Objective**: Deliver a complete Avalanche subnet (Layer1 derivative) plus an operations portal that manages validators, assets, telemetry, and reporting.
- **Major Pillars**:
  1. **Infrastructure Layer** – AvalancheGo validators, custom Subnet-EVM chain, benchmarking harness.
  2. **Control Plane API** – Backend services for orchestration, monitoring, alerts, and report generation.
  3. **Operator Portal** – Web UI for command-and-control, analytics, and documentation delivery.

```
┌──────────────────────┐       REST/gRPC        ┌──────────────────┐
│ Avalanche Subnet     │◄──────────────────────►│ Control Plane API │◄──► Postgres + Object Storage
│  Validators + P2P    │                        │ (Node.js/Nest)    │
└────────┬─────────────┘                        └────────┬─────────┘
         │ RPC/WebSocket                                 │
         ▼                                               ▼
 ┌─────────────────────┐                         ┌───────────────────┐
 │ Benchmark Runner    │                         │ Operator Portal   │
 │ (Go + Avalanche-CLI)│                         │ (Next.js + Ethers)│
 └─────────────────────┘                         └───────────────────┘
```

### 2. Infrastructure Layer
- **Avalanche Primary Setup**: Minimum three validator nodes (cloud or on-prem) running AvalancheGo v1.12+, secured with TLS, Prometheus exporters enabled.
- **Subnet Configuration**:
  - Use `avalanche-cli` to define a **Subnet-EVM** chain with custom token `AVXU`.
  - Customize fee schedule, block gas limit, and staking thresholds to support benchmarking.
  - Publish genesis + validator sets via Git-managed IaC manifest (`infrastructure/subnet-config.yaml`).
- **Benchmark & Chaos Toolkit**:
  - Dedicated runner node that can spin up load (Transaction Flood, Contract Interaction, Staking Ops).
  - Chaos scripts to simulate node downtime, network partition, and latency injection.

### 3. Control Plane API
- **Tech Stack**: Node.js 20 + NestJS, PostgreSQL, Redis/BullMQ for background jobs, MinIO/S3 for report artifacts.
- **Services**:
  1. **Validator Orchestrator** – Handles validator registration, staking ops, heartbeat verification via RPC.
  2. **Telemetry Collector** – Polls Prometheus/Metrics endpoints, normalizes KPIs (TPS, finality, CPU, memory).
  3. **Alerting Engine** – Rule-based thresholds with channels: email, Slack webhook, in-app notifications.
  4. **Benchmark Manager** – Schedules load tests and aggregates statistics.
  5. **Reporting Service** – Generates PDF/CSV deliverables using templates; stores versions for audit.
- **Security Considerations**:
  - JWT + role-based access (Admin, Operator, Viewer).
  - Vault/Key Management for validator keys and signing.
  - Audit trail for every control-plane action.

### 4. Operator Portal
- **Framework**: Next.js 14 (App Router), Tailwind CSS, Charting (ECharts/Recharts), Three.js hero animation.
- **Modules**:
  1. **Mission Control Dashboard** – Real-time KPIs, map of validators, incident ticker.
  2. **Validator Studio** – CRUD for validators, staking positions, penalty log, uptime sparkline.
  3. **Asset Hub** – Wallet integration (MetaMask + embedded custodial), token transfer wizard, gas estimator.
  4. **Benchmark Lab** – Configure scenarios, launch runs, visualize TPS/latency, compare history.
  5. **Compliance & Reporting** – Downloadable PDF/CSV, doc viewer for thesis appendices.
  6. **Docs & Tutorials** – Embedded MDX knowledge base referencing thesis chapters.
- **Offline-first & Accessibility**: Service worker caching for dashboards, WCAG AA color contrast, keyboard navigation.

### 5. Data Management
- **PostgreSQL Schema Highlights**:
  - `validators(id, node_id, stake_amount, status, last_heartbeat, penalties JSONB)`
  - `metrics(run_id, validator_id, tps, finality_ms, cpu, memory, recorded_at)`
  - `benchmarks(id, scenario, params JSONB, result JSONB, started_at, completed_at)`
  - `alerts(id, rule_id, severity, message, status, created_at)`
  - `reports(id, type, storage_uri, checksum, created_by)`
- **Event Streaming**: Optional Kafka/NATS stream for real-time metric push to UI sockets.

### 6. Deployment & DevOps
- **Local Dev**: Docker Compose spinning Avalanche Local Network + API + UI.
- **Environments**: `dev` (local), `staging` (testnet validators), `prod` (public demonstration cluster).
- **CI/CD**:
  - Lint/test pipelines (ESLint, Jest, Go test).
  - IaC validation (Terraform fmt/validate for infra state).
  - Security scans (Snyk, npm audit, Trivy for containers).
- **Observability**:
  - Prometheus + Grafana stack for infra metrics.
  - ELK/Opensearch for API logs.
  - Synthetic checks verifying RPC endpoints and API health.

### 7. Resilience & Non-Functional Guarantees
- **Availability**: Target 99.5% uptime for control-plane APIs, 99% for validators during demo.
- **Performance**: Subnet TPS goal > 1,000 with < 2s finality under benchmark scenario B.
- **Security**: Enforce MFA for admin accounts, encrypted secrets at rest, regular key rotation.
- **Scalability**: Horizontal scale API pods; partition metrics storage by run_id to support long benchmarks.

### 8. Thesis Alignment
- Each component maps to a thesis chapter:
  1. **Theory** – Avalanche consensus deep dive.
  2. **Design** – Architecture described above.
  3. **Implementation** – Subnet scripts + API + Portal.
  4. **Evaluation** – Benchmark + chaos experiments.
  5. **Operations & Governance** – Alerting, reporting, security controls.

This document should accompany more detailed module specs (see `requirements.md`) and implementation plans (`implementation-roadmap.md`).

