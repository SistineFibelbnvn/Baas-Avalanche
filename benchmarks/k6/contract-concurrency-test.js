import http from 'k6/http';
import { check, fail, sleep } from 'k6';

// Config
const API_URL = __ENV.API_URL || 'http://localhost:4000';

export const options = {
    scenarios: {
        contract_storm: {
            executor: 'per-vu-iterations',
            vus: 10,            // 10 concurrent users (deployers)
            iterations: 5,      // Each user deploys 5 contracts
            maxDuration: '10m', // Stop if taking too long
        },
    },
    thresholds: {
        'http_req_failed': ['rate<0.05'], // Allow < 5% failures (due to nonce collisions etc)
        'http_req_duration': ['p(95)<5000'], // 95% of deployments should take < 5s
    },
};

// Simple Storage Contract (Bytecode)
const BYTECODE = "0x608060405234801561001057600080fd5b5060d48061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146062575b600080fd5b606060048036036020811015604b57600080fd5b8101908080359060200190929190505050607e565b005b60686088565b6040518082815260200191505060405180910390f35b8060008190555050565b6000805490509056fea2646970667358221220f8c381c82800537f00e9a5840d87928ecf822151675204481358309dfd38a8ca64736f6c63430008070033";
const ABI = [{ "inputs": [{ "internalType": "uint256", "name": "x", "type": "uint256" }], "name": "set", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "get", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];

export default function () {
    const vuId = __VU;
    const iterId = __ITER;

    // Random small delay to avoid exact MS collision
    sleep(Math.random() * 2);

    const payload = JSON.stringify({
        name: `Load_Contract_U${vuId}_I${iterId}`,
        sourceCode: "// Stress Testing",
        bytecode: BYTECODE,
        abi: JSON.stringify(ABI),
        network: "C", // Deploy to Chain C
        args: []
    });

    const headers = { 'Content-Type': 'application/json' };

    const res = http.post(`${API_URL}/contracts/deploy`, payload, { headers });

    const success = check(res, {
        'Deployed (201)': (r) => r.status === 201,
        'Has Address': (r) => r.json('address') !== undefined,
    });

    if (success) {
        const addr = res.json('address');
        console.log(`[User ${vuId}] ✅ Deployed #${iterId} at ${addr}`);
    } else {
        console.error(`[User ${vuId}] ❌ Failed #${iterId}: ${res.status} ${res.body}`);
    }
}
