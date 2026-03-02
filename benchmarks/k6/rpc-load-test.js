import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Custom metrics
const successfulTx = new Counter('successful_transactions');
const failedTx = new Counter('failed_transactions');
const txLatency = new Trend('transaction_latency', true);
const txSuccessRate = new Rate('transaction_success_rate');

// Configuration
const BASE_URL = __ENV.RPC_URL || 'http://127.0.0.1:9650/ext/bc/C/rpc';
const PRIVATE_KEY = __ENV.PRIVATE_KEY || '56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027'; // EWOQ key

// Test options
export const options = {
    scenarios: {
        // Ramp up load test
        load_test: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '30s', target: 10 },  // Ramp up to 10 users
                { duration: '1m', target: 10 },   // Stay at 10 users
                { duration: '30s', target: 50 },  // Ramp up to 50 users
                { duration: '1m', target: 50 },   // Stay at 50 users
                { duration: '30s', target: 0 },   // Ramp down
            ],
        },
        // Spike test (optional, run with --scenario spike_test)
        spike_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 100 }, // Fast spike
                { duration: '1m', target: 100 },  // Hold
                { duration: '10s', target: 0 },   // Fast drop
            ],
            exec: 'spikeTest',
            startTime: '5m', // Start after load test
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        transaction_success_rate: ['rate>0.95'], // Success rate should be above 95%
        successful_transactions: ['count>100'], // At least 100 successful transactions
    },
};

// Helper: JSON-RPC request
function jsonRpc(method, params = []) {
    const payload = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params,
    });

    const response = http.post(BASE_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    return response;
}

// Setup function - runs once at the start
export function setup() {
    console.log(`Testing RPC endpoint: ${BASE_URL}`);

    // Check if node is reachable
    const res = jsonRpc('eth_blockNumber');
    if (res.status !== 200) {
        throw new Error(`Node not reachable: ${res.status}`);
    }

    const body = JSON.parse(res.body);
    console.log(`Current block number: ${parseInt(body.result, 16)}`);

    return { startBlock: parseInt(body.result, 16) };
}

// Default function - main test
export default function (data) {
    // Test 1: Get block number
    const blockRes = jsonRpc('eth_blockNumber');
    check(blockRes, {
        'block number status 200': (r) => r.status === 200,
        'block number has result': (r) => JSON.parse(r.body).result !== undefined,
    });

    // Test 2: Get chain ID
    const chainIdRes = jsonRpc('eth_chainId');
    check(chainIdRes, {
        'chain ID status 200': (r) => r.status === 200,
    });

    // Test 3: Get gas price
    const gasPriceRes = jsonRpc('eth_gasPrice');
    check(gasPriceRes, {
        'gas price status 200': (r) => r.status === 200,
        'gas price has result': (r) => JSON.parse(r.body).result !== undefined,
    });

    // Test 4: Send transaction (simulated - get nonce)
    const startTime = Date.now();
    const nonceRes = jsonRpc('eth_getTransactionCount', [
        '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC', // EWOQ address
        'latest'
    ]);

    const endTime = Date.now();
    const latency = endTime - startTime;

    txLatency.add(latency);

    const success = check(nonceRes, {
        'nonce request successful': (r) => r.status === 200,
    });

    if (success) {
        successfulTx.add(1);
        txSuccessRate.add(1);
    } else {
        failedTx.add(1);
        txSuccessRate.add(0);
    }

    // Small delay between iterations
    sleep(Math.random() * 0.5 + 0.1);
}

// Spike test function
export function spikeTest() {
    const res = jsonRpc('eth_blockNumber');
    check(res, {
        'spike: status 200': (r) => r.status === 200,
    });
    sleep(0.1);
}

// Teardown function - runs once at the end
export function teardown(data) {
    const res = jsonRpc('eth_blockNumber');
    const body = JSON.parse(res.body);
    const endBlock = parseInt(body.result, 16);

    console.log(`\n=== Test Summary ===`);
    console.log(`Start block: ${data.startBlock}`);
    console.log(`End block: ${endBlock}`);
    console.log(`Blocks produced during test: ${endBlock - data.startBlock}`);
}
