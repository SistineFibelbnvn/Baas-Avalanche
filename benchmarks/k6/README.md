# k6 Performance Testing for Avalanche RPC

This directory contains k6 load testing scripts and Grafana dashboards for testing Avalanche RPC endpoints.

## Prerequisites

1. **k6** - Install from https://k6.io/docs/getting-started/installation/
   ```bash
   # Windows (chocolatey)
   choco install k6
   
   # macOS
   brew install k6
   
   # Ubuntu/Debian
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Docker & Docker Compose** - For InfluxDB and Grafana

## Quick Start

### 1. Start the Avalanche Node

Make sure your Avalanche node is running:
```bash
# Local node should be accessible at
# http://127.0.0.1:9650
```

### 2. Start InfluxDB & Grafana

```bash
cd benchmarks/k6
docker compose up -d
```

This will start:
- **InfluxDB**: http://localhost:8086 (k6 metrics storage)
- **Grafana**: http://localhost:3001 (visualization)
  - Login: admin / admin

### 3. Run k6 Tests

#### Basic Load Test
```bash
# Run with default options
k6 run rpc-load-test.js

# Run with InfluxDB output (for Grafana visualization)
k6 run --out influxdb=http://localhost:8086/k6 rpc-load-test.js

# Run against custom RPC URL
k6 run --out influxdb=http://localhost:8086/k6 -e RPC_URL=http://127.0.0.1:9650/ext/bc/C/rpc rpc-load-test.js
```

#### Stress Test
```bash
k6 run --out influxdb=http://localhost:8086/k6 stress-test.js
```

### 4. View Results in Grafana

1. Open http://localhost:3001
2. Login with admin / admin
3. Go to Dashboards → k6 → "k6 Avalanche Load Test"
4. Watch live metrics as k6 runs

## Test Scripts

### rpc-load-test.js
Basic load test that simulates realistic RPC usage:
- Ramps up from 1 to 50 virtual users
- Tests: eth_blockNumber, eth_chainId, eth_gasPrice, eth_getTransactionCount
- Duration: ~4 minutes
- Thresholds: p95 < 500ms, success rate > 95%

### stress-test.js
Stress test to find the breaking point:
- Ramps from 10 to 300 requests per second
- Tests read and write operations in groups
- Duration: ~10 minutes
- Finds maximum throughput before errors increase

## Custom RPC URL

Test against your custom L1 network:
```bash
k6 run -e RPC_URL=http://127.0.0.1:9650/ext/bc/YOUR_BLOCKCHAIN_ID/rpc rpc-load-test.js
```

## Output Options

### JSON Report
```bash
k6 run --out json=results.json rpc-load-test.js
```

### CSV Report
```bash
k6 run --out csv=results.csv rpc-load-test.js
```

### HTML Report (using k6-reporter)
```bash
k6 run --summary-export=summary.json rpc-load-test.js
```

## Thresholds & Pass/Fail

The tests include built-in thresholds:
- `http_req_duration`: 95th percentile < 500ms
- `transaction_success_rate`: > 95%
- `successful_transactions`: > 100 total

If thresholds are not met, k6 will exit with code 1.

## Customizing Tests

Edit the `options` object in the test scripts:

```javascript
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 100 },  // Increase users
        { duration: '2m', target: 100 },  // Hold
        { duration: '30s', target: 0 },   // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<1000'],  // Stricter threshold
  },
};
```

## Cleanup

```bash
# Stop containers
docker compose down

# Remove volumes (clears data)
docker compose down -v
```

## Troubleshooting

### k6 can't connect to RPC
- Ensure Avalanche node is running
- Check firewall settings
- Verify RPC URL is correct

### InfluxDB connection refused
- Make sure Docker containers are running: `docker compose ps`
- Check InfluxDB logs: `docker compose logs influxdb`

### Grafana shows no data
- Verify k6 is running with `--out influxdb=...`
- Check time range in Grafana (should be "Last 15 minutes")
- Verify datasource is configured correctly
