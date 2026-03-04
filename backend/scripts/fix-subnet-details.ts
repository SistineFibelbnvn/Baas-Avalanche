
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const SUBNET_ID = 'subnet1765889840094';
    const BLOCKCHAIN_ID = '2c5wsxkTLcpndDr8m4ECXh39E1XQTd2a8WFMnQh23VHYcEUdku';
    const RPC_URL = `http://127.0.0.1:9654/ext/bc/${BLOCKCHAIN_ID}/rpc`;

    console.log(`Updating details for ${SUBNET_ID}...`);
    console.log(`Setting BlockchainID to ${BLOCKCHAIN_ID}`);
    console.log(`Setting RPC URL to ${RPC_URL}`);

    try {
        const result = await prisma.network.updateMany({
            where: { id: SUBNET_ID },
            data: {
                blockchainId: BLOCKCHAIN_ID,
                subnetId: SUBNET_ID,
                rpcUrl: RPC_URL,
                // WS URL is typically just wss variant
                wsUrl: RPC_URL.replace('http:', 'ws:').replace('/rpc', '/ws')
            }
        });

        console.log(`Updated ${result.count} record(s).`);

        // Verify
        const updated = await prisma.network.findUnique({
            where: { id: SUBNET_ID },
        });

        if (updated) {
            console.log('Verification Success:');
            console.log(`ID: ${updated.id}`);
            console.log(`BlockchainID: ${updated.blockchainId}`);
            console.log(`RPC: ${updated.rpcUrl}`);
        }

    } catch (e) {
        console.error('Error updating details:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
