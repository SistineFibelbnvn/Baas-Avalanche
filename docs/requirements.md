## Functional & Non-Functional Requirements

### 1. Functional Requirements

#### 1.1 Subnet & Validator Management
1. System SHALL provision an Avalanche Subnet-EVM network with ≥3 validators.
2. System SHALL allow administrators to:
   - Add/remove validators via backend (staking transactions).
   - Adjust staking thresholds, delegation fees, lockup durations.
   - View validator status, last heartbeat, penalties.
3. System SHALL expose REST/gRPC endpoints for validator lifecycle operations.

#### 1.2 Token & Transaction Operations
4. Custom token `AVXU` SHALL exist as native subnet currency; smart contracts SHALL support ERC-20-style transfers.
5. Portal SHALL provide wallet integration (MetaMask + custodial) for sending/receiving tokens.
6. Users SHALL see on-chain transaction history, pending status, and gas estimations.

#### 1.3 Telemetry & Monitoring
7. Control-plane SHALL collect metrics (TPS, finality, CPU, memory, p2p health) every ≤5 seconds.
8. Dashboard SHALL render real-time KPIs plus historical charts.
9. Alerting engine SHALL trigger notifications when thresholds are breached (e.g., TPS drop >30%, validator offline >60s).

#### 1.4 Benchmark & Chaos Testing
10. Benchmark manager SHALL support predefined scenarios:
    - **Scenario A**: High-frequency transfers.
    - **Scenario B**: Smart contract interactions.
    - **Scenario C**: Validator churn.
11. Users SHALL configure parameters (transactions/sec, contract address, duration).
12. System SHALL store benchmark results, allow comparison, and export PDF/CSV summaries.
13. Chaos toolkit SHALL simulate node failure/latency and record recovery metrics.

#### 1.5 Reporting & Documentation
14. Reporting service SHALL generate thesis-ready artifacts (PDF/Markdown) summarizing performance, incidents, changes.
15. Portal SHALL embed documentation (MDX) linking to methodology chapters.

#### 1.6 Security & Governance
16. Authentication SHALL require email+password with MFA for admins.
17. RBAC SHALL enforce scopes: Admin > Operator > Viewer.
18. Every sensitive action SHALL log to an immutable audit table.
19. Validator keys SHALL be encrypted and never exposed to UI.

### 2. Non-Functional Requirements

#### 2.1 Performance
- Subnet SHOULD sustain ≥1,000 TPS with <2s finality during Scenario B.
- API response time SHOULD remain <300ms for 95th percentile calls.

#### 2.2 Availability & Reliability
- Control plane availability target: 99.5%.
- Portal must degrade gracefully (read-only) if backend loses write capability.
- Benchmarks MUST be resumable after failure; partial data flagged.

#### 2.3 Security
- Secrets stored via Vault/KMS; encrypted in transit and at rest.
- Automated dependency scanning (Snyk, npm audit, Trivy).
- Regular key rotation schedule documented and tested.

#### 2.4 Maintainability
- Codebase SHALL follow monorepo structure with shared linting / formatting.
- Comprehensive unit, integration, and load tests.
- Observability dashboards documented for future operators.

#### 2.5 Usability
- UI SHALL support English + Vietnamese localization.
- WCAG 2.1 AA compliance: keyboard navigation, sufficient contrast.
- Provide guided walkthroughs/onboarding modals for new operators.

### 3. Acceptance Criteria
- Demonstration subnet running with real validators.
- Portal shows live metrics, supports validator operations end-to-end.
- At least two benchmark reports attached in appendix.
- Thesis document references architecture, implementation, and evaluation outputs from this system.

