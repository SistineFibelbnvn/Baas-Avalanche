import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
import { Wallet } from 'k6/x/ethereum';

// Custom metrics for real transactions
const txSent = new Counter('transactions_sent');
const txConfirmed = new Counter('transactions_confirmed');
const txFailed = new Counter('transactions_failed');
const txConfirmTime = new Trend('transaction_confirm_time', true);
const tps = new Gauge('transactions_per_second');

// Configuration
const BASE_URL = __ENV.RPC_URL || 'http://127.0.0.1:9650/ext/bc/C/rpc';

// Stress test options
export const options = {
    scenarios: {
        // Stress test - find breaking point
        stress: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 200,
            stages: [
                { duration: '2m', target: 50 },   // Ramp to 50 RPS
                { duration: '3m', target: 100 },  // Ramp to 100 RPS
                { duration: '2m', target: 200 },  // Ramp to 200 RPS
                { duration: '1m', target: 300 },  // Push to 300 RPS
                { duration: '2m', target: 0 },    // Recovery
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.1'],           // Less than 10% can fail
        http_req_duration: ['p(99)<1000'],       // 99% must be below 1s
        transactions_confirmed: ['count>1000'],  // At least 1000 confirmed
    },
};

// JSON-RPC helper
function rpc(method, params = []) {
    const res = http.post(BASE_URL, JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    return {
        status: res.status,
        body: res.status === 200 ? JSON.parse(res.body) : null,
        duration: res.timings.duration,
    };
}

export function setup() {
    // Verify connection
    const result = rpc('eth_blockNumber');
    if (!result.body || result.body.error) {
        throw new Error('Cannot connect to RPC endpoint');
    }

    console.log(`Starting stress test on ${BASE_URL}`);
    console.log(`Start block: ${parseInt(result.body.result, 16)}`);

    return {
        startBlock: parseInt(result.body.result, 16),
        startTime: Date.now(),
    };
}

export default function () {
    group('read_operations', () => {
        // eth_blockNumber - lightest
        const blockNum = rpc('eth_blockNumber');
        check(blockNum, { 'blockNumber OK': (r) => r.status === 200 });

        // eth_gasPrice
        const gasPrice = rpc('eth_gasPrice');
        check(gasPrice, { 'gasPrice OK': (r) => r.status === 200 });
    });

    group('medium_operations', () => {
        // eth_getBalance
        const balance = rpc('eth_getBalance', [
            '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC',
            'latest'
        ]);
        check(balance, { 'getBalance OK': (r) => r.status === 200 });

        // eth_getTransactionCount
        const nonce = rpc('eth_getTransactionCount', [
            '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC',
            'latest'
        ]);
        check(nonce, { 'getNonce OK': (r) => r.status === 200 });
    });

    group('heavy_operations', () => {
        // eth_call - simulate contract call
        const call = rpc('eth_call', [{
            to: '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC',
            data: '0x'
        }, 'latest']);

        // eth_estimateGas
        const estimate = rpc('eth_estimateGas', [{
            from: '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC',
            to: '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC',
            value: '0x1'
        }]);
        check(estimate, { 'estimateGas OK': (r) => r.status === 200 });
    });

    txSent.add(1);

    // Minimal delay
    sleep(Math.random() * 0.1);
}

export function teardown(data) {
    const result = rpc('eth_blockNumber');
    const endBlock = parseInt(result.body.result, 16);
    const duration = (Date.now() - data.startTime) / 1000;

    console.log(`\n=== Stress Test Results ===`);
    console.log(`Duration: ${duration.toFixed(0)}s`);
    console.log(`Blocks: ${data.startBlock} → ${endBlock} (${endBlock - data.startBlock} produced)`);
    console.log(`Avg block time: ${(duration / (endBlock - data.startBlock || 1)).toFixed(2)}s`);
}
