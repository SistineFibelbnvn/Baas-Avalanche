## Infrastructure Toolkit – AVXU Subnet

This folder contains infrastructure-as-code artifacts and automation scripts referenced throughout the thesis. The intent is to provision and operate a custom Avalanche Subnet-EVM network (code name **AVXU**) with reproducible steps.

### 1. Prerequisites
- AvalancheGo v1.12+ installed on validator nodes (Linux or Windows Server).
- `avalanche-cli` (latest) installed locally (`curl -sSfL https://github.com/ava-labs/avalanche-cli/releases/latest/download/avalanche-cli-linux --output avalanche-cli`).
- Docker & Docker Compose (for local test clusters).
- Access to cloud or bare-metal instances with public IPs, minimum spec: 4 vCPU, 8GB RAM, 200GB SSD.

### 2. Repository Layout (planned)
```
infrastructure/
  README.md
  subnet-config.yaml          # Input for avalanche-cli create subnet
  validators.sample.json      # Example validator definitions
  scripts/
    bootstrap-subnet.sh       # Linux/macOS automation
    bootstrap-subnet.ps1      # Windows PowerShell automation
    register-validator.sh     # Helper for staking transactions (todo)
    run-local-runner.sh       # Wrapper around avalanche-network-runner (todo)
```

### 3. Workflow Summary
1. **Generate Subnet** – customize `subnet-config.yaml`, then run one of the bootstrap scripts (see below). This step creates the Subnet-EVM genesis and validator set.
2. **Distribute Genesis + Node Keys** – copy generated artifacts to each validator node. Secure keys via Vault/KMS.
3. **Start Validators** – run AvalancheGo with `--http-host=0.0.0.0 --network-id=custom --config-file=avxu-config.json`.
4. **Validate Connectivity** – confirm peers discovered, RPC reachable, and metrics exported to Prometheus gateway.
5. **Run Network Runner (Optional)** – spin up ephemeral clusters for integration tests via Avalanche Network Runner.

### 4. Bootstrap Script Usage
#### Linux/macOS
```bash
cd infrastructure/scripts
chmod +x bootstrap-subnet.sh
./bootstrap-subnet.sh --subnet avxu --validators ../validators.sample.json
```

#### Windows
```powershell
cd infrastructure\scripts
./bootstrap-subnet.ps1 -SubnetName avxu -ValidatorFile ..\validators.sample.json
```

Scripts will:
1. Ensure `avalanche-cli` exists and matches minimum version.
2. Call `avalanche subnet create` with `subnet-config.yaml`.
3. Export the genesis + chain config into `output/avxu`.
4. Print next steps for adding validators and deploying to production/staging.

### 5. Next Steps
- Populate `validators.sample.json` with your validator nodeIDs and staking info.
- Add Terraform/Ansible playbooks for cloud provisioning (placeholder).
- Wire CI to validate YAML + shell formatting (`yamllint`, `shfmt`, `powershell-scriptanalyzer`).

> These assets align directly with the thesis implementation chapter. Keep the folder updated as you iterate on infrastructure experiments.

