import http from 'k6/http';
import { sleep, check, fail } from 'k6';
import { Counter } from 'k6/metrics';

// Config
const API_URL = __ENV.API_URL || 'http://localhost:4000';
const TIMEOUT_SECONDS = 300; // 5 minutes timeout

export const options = {
    // Functional test - 1 user only
    vus: 1,
    iterations: 1,
    thresholds: {
        'http_req_failed': ['rate==0'], // No HTTP errors allowed
    },
};

export default function () {
    const subnetName = `K6_Benchmark_${Date.now()}`;
    console.log(`🚀 Starting Subnet Creation Test: ${subnetName}`);

    // 1. Create Subnet Request
    const payload = JSON.stringify({
        name: subnetName,
        network: 'LOCAL',
        vmType: 'subnet-evm',
        config: {
            vmVersion: 'latest',
            chainId: Math.floor(Math.random() * 10000) + 2000,
            tokenSymbol: 'K6',
        },
    });

    const headers = { 'Content-Type': 'application/json' };

    const createRes = http.post(`${API_URL}/subnets`, payload, { headers });

    const success = check(createRes, {
        'Create request accepted (201)': (r) => r.status === 201,
    });

    if (!success) {
        console.error(`❌ Creation failed: ${createRes.status} ${createRes.body}`);
        fail('Failed to submit creation request');
    }

    const subnetId = createRes.json('id');
    console.log(`✅ Subnet created with ID: ${subnetId}. Waiting for deployment...`);

    // 2. Poll for Status
    let status = 'CREATING';
    const startTime = Date.now();

    while (status !== 'RUNNING' && status !== 'FAILED') {
        // Timeout check
        if ((Date.now() - startTime) / 1000 > TIMEOUT_SECONDS) {
            fail(`❌ Timeout: Subnet creation took longer than ${TIMEOUT_SECONDS}s`);
        }

        sleep(5); // Wait 5s between checks

        const statusRes = http.get(`${API_URL}/subnets/${subnetId}`);

        if (statusRes.status !== 200) {
            console.warn(`WARNING: Failed to fetch status: ${statusRes.status}`);
            continue;
        }

        const currentSubnet = statusRes.json();
        status = currentSubnet.status;

        // Log progress from operations
        const operationsRes = http.get(`${API_URL}/subnets/${subnetId}/operations`);
        if (operationsRes.status === 200) {
            const ops = operationsRes.json();
            if (ops.length > 0) {
                const lines = ops[0].log.split('\n');
                const lastLine = lines[lines.length - 1]; // Get latest log
                if (lastLine) console.log(`   [${status}] ${lastLine.substring(0, 80)}...`);
            }
        }
    }

    // 3. Final Verification
    check(status, {
        'Subnet status is RUNNING': (s) => s === 'RUNNING',
    });

    if (status === 'RUNNING') {
        const finalRes = http.get(`${API_URL}/subnets/${subnetId}`);
        const finalData = finalRes.json();
        console.log(`\n🎉 SUBNET DEPLOYED SUCCESSFULLY!`);
        console.log(`ID: ${finalData.subnetId}`);
        console.log(`Chain ID: ${finalData.chainId}`);
        console.log(`RPC URL: ${finalData.rpcUrl}`);
    } else {
        fail(`❌ Subnet creation failed with status: ${status}`);
    }
}
