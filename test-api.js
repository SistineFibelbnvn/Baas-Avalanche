// Test peer count and gas price APIs
const BASE_URL = 'http://127.0.0.1:9650';
const RPC_URL = `${BASE_URL}/ext/bc/C/rpc`;

async function testPeerCount() {
    console.log('=== Testing info.peers ===');
    try {
        const res = await fetch(`${BASE_URL}/ext/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'info.peers' })
        });
        const data = await res.json();
        console.log('Raw response:', JSON.stringify(data, null, 2).substring(0, 500));
        console.log('Peer count:', data.result?.peers?.length || 0);
        if (data.result?.numPeers !== undefined) {
            console.log('numPeers field:', data.result.numPeers);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function testGasPrice() {
    console.log('\n=== Testing eth_gasPrice ===');
    try {
        const res = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] })
        });
        const data = await res.json();
        console.log('Raw response:', JSON.stringify(data));
        if (data.result) {
            const gwei = parseInt(data.result, 16) / 1e9;
            console.log('Gas price:', gwei, 'Gwei');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

async function testInfoNodeVersion() {
    console.log('\n=== Testing info.getNodeVersion ===');
    try {
        const res = await fetch(`${BASE_URL}/ext/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'info.getNodeVersion' })
        });
        const data = await res.json();
        console.log('Node version:', JSON.stringify(data.result));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

(async () => {
    await testInfoNodeVersion();
    await testPeerCount();
    await testGasPrice();
})();
