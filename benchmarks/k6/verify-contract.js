import http from 'k6/http';
import { check, fail } from 'k6';

const API_URL = __ENV.API_URL || 'http://localhost:4000';

export const options = {
    vus: 1,
    iterations: 1,
};

// Simple Bytecode for a "Hello World" Storage Contract
// set(uint256), get()
const BYTECODE = "0x608060405234801561001057600080fd5b5060d48061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146062575b600080fd5b606060048036036020811015604b57600080fd5b8101908080359060200190929190505050607e565b005b60686088565b6040518082815260200191505060405180910390f35b8060008190555050565b6000805490509056fea2646970667358221220f8c381c82800537f00e9a5840d87928ecf822151675204481358309dfd38a8ca64736f6c63430008070033";
const ABI = [{ "inputs": [{ "internalType": "uint256", "name": "x", "type": "uint256" }], "name": "set", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "get", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];

export default function () {
    console.log(`🔍 Starting Contract Verification Test...`);

    // 1. Compile/Prepare payload
    // In real app, we send source, here we simulate the Deploy API
    // Assuming Backend has an endpoint POST /contracts/deploy

    const payload = JSON.stringify({
        name: "VerificationContract",
        sourceCode: "// Simple Storage", // Dummy source
        bytecode: BYTECODE,
        abi: JSON.stringify(ABI),
        network: "LOCAL", // Target the local network
        args: []
    });

    const headers = { 'Content-Type': 'application/json' };

    // Call Backend API to deploy
    console.log(`   Sending deploy request to ${API_URL}/contracts/deploy ...`);

    // Note: Adjust endpoint if your backend uses a different path
    const res = http.post(`${API_URL}/contracts/deploy`, payload, { headers });

    const success = check(res, {
        'Status is 201 (Created)': (r) => r.status === 201,
        'Has contract address': (r) => r.json('address') !== undefined,
    });

    if (!success) {
        console.error(`❌ Deployment Failed: ${res.status} ${res.body}`);
        // If 404, maybe endpoint is different?
        if (res.status === 404) {
            console.warn("⚠️ Hint: Check if POST /contracts/deploy endpoint exists exists in your backendController.");
        }
        fail('Contract Verification Failed');
    }

    const data = res.json();
    console.log(`✅ Contract Deployed Successfully!`);
    console.log(`   Address: ${data.address}`);
    console.log(`   Transaction Hash: ${data.transactionHash}`);

    // Optional: Verify deployment on chain
    // (We could query RPC here, but getting 201 + valid address is good enough for smoke test)
}
