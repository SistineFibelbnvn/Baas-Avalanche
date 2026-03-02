## Implementation Roadmap

### Phase 0 – Planning & Environment (Week 1)
- Finalize requirements & success metrics (docs/requirements.md).
- Provision dev machines, Docker, Node.js 20, Go 1.21, Python 3.11.
- Set up monorepo skeleton:
  - `infrastructure/` – subnet configs, Terraform, scripts.
  - `backend/` – NestJS service.
  - `frontend/` – Next.js operator portal.
  - `benchmarks/` – Go-based load generator + chaos scripts.
- Configure CI (GitHub Actions) for lint/test.

### Phase 1 – Subnet Foundation (Weeks 2–3)
- Install AvalancheGo on validator nodes; enable metrics/prometheus.
- Use `avalanche-cli` to create `avxu-subnet`:
  - Custom fee config, block gas limit 40M, reward rates per thesis spec.
  - Export genesis JSON, commit to repo.
- Automate validator enrollment via scripts (PowerShell/Bash) + documentation.
- Validate P2P connectivity, measure baseline TPS.

### Phase 2 – Backend Control Plane (Weeks 3–5)
- Scaffold NestJS modules:
  1. `AuthModule` with JWT/MFA.
  2. `ValidatorModule` for orchestrating staking ops.
  3. `MetricsModule` polling RPC & Prometheus.
  4. `AlertModule` using BullMQ workers.
  5. `BenchmarkModule` orchestrating Go runner.
  6. `ReportModule` generating PDF/CSV (e.g., using Puppeteer).
- Define PostgreSQL schema + Prisma/TypeORM migrations.
- Implement REST/gRPC endpoints, unit tests, OpenAPI spec.

### Phase 3 – Benchmark & Chaos Toolkit (Weeks 5–6)
- Build Go CLI (`benchmarks/cmd/avxu-bench`) with subcommands:
  - `transfer-storm`, `contract-call`, `validator-churn`, `chaos-latency`.
- Integrate with backend via message queue (Redis or NATS).
- Capture metrics via gRPC streaming; persist run artifacts (JSON + CSV).
- Implement chaos experiments and recovery scripts.

### Phase 4 – Operator Portal (Weeks 6–8)
- Create Next.js App Router structure with shared UI kit.
- Core pages:
  - `/dashboard` – KPIs, incident banner, validator map.
  - `/validators` – CRUD, detail view, penalty timeline.
  - `/assets` – Wallet, transaction composer, history.
  - `/benchmarks` – Scenario builder, run viewer, comparisons.
  - `/reports` – Listing, preview, download.
  - `/docs` – MDX knowledge base linking thesis content.
- Integrate WebSocket/Server-Sent Events for live metrics.
- Implement RBAC-aware components & localization (vi/en).

### Phase 5 – Security, Observability, Hardening (Weeks 8–9)
- Add MFA, password policies, session management.
- Wire Prometheus exporters, Grafana dashboards, Loki/ELK logs.
- Pen-test critical flows (validator keys, report downloads).
- Add chaos drills to CI nightly (optional).

### Phase 6 – Evaluation & Thesis Artifacts (Weeks 9–10)
- Conduct official benchmark runs; document methodology & results.
- Generate final PDF reports and screenshots for thesis chapters.
- Write deployment + operation guides.
- Perform final demo rehearsal (scripts + fallback plan).

### Deliverables Checklist
- Running subnet with scripts to reproduce.
- Backend API + documentation + automated tests.
- Frontend portal with required modules and localization.
- Benchmark CLI + chaos suite.
- Reports, dashboards, and thesis appendices referencing data.
- Deployment guide and maintenance handbook.

