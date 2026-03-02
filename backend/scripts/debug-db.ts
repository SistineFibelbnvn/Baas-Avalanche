
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const networks = await prisma.network.findMany();
        console.log(`Found ${networks.length} networks in database:`);
        networks.forEach(n => {
            console.log(`- ID: ${n.id}, Name: ${n.name}, Status: ${n.status}, SubnetID: ${n.subnetId}`);
        });

        // Also check operations to see if there's any pending op for the missing subnet
        const ops = await prisma.operation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log(`\nRecent operations:`);
        ops.forEach(op => {
            console.log(`- ${op.type} (${op.status}) for network ${op.networkId}`);
        });

    } catch (e) {
        console.error('Error listing networks:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
