import http from 'k6/http';
import { sleep, check, fail } from 'k6';

// Config
const API_URL = __ENV.API_URL || 'http://localhost:4000';
const TIMEOUT_SECONDS = 400; // Longer timeout for concurrent operations

export const options = {
    // Concurrency Test: 3 users creating subnets AT THE SAME TIME
    scenarios: {
        concurrent_creation: {
            executor: 'per-vu-iterations',
            vus: 3,             // 3 simultaneous users
            iterations: 1,      // Each user creates 1 subnet
            maxDuration: '10m',
        },
    },
    thresholds: {
        'http_req_failed': ['rate<0.1'], // Allow some failures (it's a stress test)
    },
};

export default function () {
    // Unique name for each user/iteration
    const vuId = __VU;
    const subnetName = `Stress_Subnet_User${vuId}_${Date.now()}`;

    console.log(`[User ${vuId}] 🚀 Requesting Subnet: ${subnetName}`);

    // 1. Create Subnet Request
    const payload = JSON.stringify({
        name: subnetName,
        network: 'LOCAL',
        vmType: 'subnet-evm',
        config: {
            vmVersion: 'latest',
            // Random Chain ID to avoid collisions
            chainId: Math.floor(Math.random() * 50000) + 10000,
            tokenSymbol: `T${vuId}`,
        },
    });

    const headers = { 'Content-Type': 'application/json' };

    const createRes = http.post(`${API_URL}/subnets`, payload, { headers });

    const success = check(createRes, {
        'Create accepted (201)': (r) => r.status === 201,
    });

    if (!success) {
        console.error(`[User ${vuId}] ❌ Request failed: ${createRes.status}`);
        return; // Exit this iteration
    }

    const subnetId = createRes.json('id');
    console.log(`[User ${vuId}] ✅ Accepted. ID: ${subnetId}. Waiting for deploy...`);

    // 2. Poll for Status (Concurrency handling)
    let status = 'CREATING';
    const startTime = Date.now();

    while (status !== 'RUNNING' && status !== 'FAILED') {
        // Timeout check
        if ((Date.now() - startTime) / 1000 > TIMEOUT_SECONDS) {
            console.error(`[User ${vuId}] ❌ Timeout awaiting deployment`);
            break;
        }

        // Random sleep to de-sync polling (avoid hammering API at exact same ms)
        sleep(Math.random() * 5 + 3);

        const statusRes = http.get(`${API_URL}/subnets/${subnetId}`);

        if (statusRes.status !== 200) {
            continue;
        }

        const currentSubnet = statusRes.json();
        status = currentSubnet.status;
    }

    // 3. Final Result
    if (status === 'RUNNING') {
        const finalRes = http.get(`${API_URL}/subnets/${subnetId}`);
        const finalData = finalRes.json();
        console.log(`\n[User ${vuId}] 🎉 SUCCESS! Subnet ${subnetName} is RUNNING!`);
        console.log(`[User ${vuId}] RPC: ${finalData.rpcUrl}`);
    } else {
        console.error(`[User ${vuId}] ❌ FAILED! Status: ${status}`);
    }
}
