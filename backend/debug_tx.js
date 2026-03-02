
const { ethers } = require('ethers');

async function main() {
    const rpcUrl = 'http://127.0.0.1:9650/ext/bc/C/rpc';
    console.log('Connecting to:', rpcUrl);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const blockNum = await provider.getBlockNumber();
        console.log('Current Block:', blockNum);

        for (let i = 0; i < 5; i++) {
            const b = await provider.getBlock(blockNum - i, true);
            if (!b) continue;
            console.log(`Block #${b.number} has ${b.transactions.length} txs`);
            if (b.transactions.length > 0) {
                console.log('First Tx:', b.transactions[0]);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
