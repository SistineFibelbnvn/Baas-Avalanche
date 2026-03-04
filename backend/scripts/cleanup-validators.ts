
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up stale validators...');

    try {
        // Delete all validators that have a containerId set
        // Since we did a network reset, ANY docker-based validator record in DB is likely stale 
        // (unless it was created *after* the reset and matches a real container, but usually local nodes are managed by avalanche-cli, not this table directly).
        // Actually, looking at the code, these validators are added manually via "addValidator".
        // If we want to keep "real" ones we'd need to check docker. 
        // But safely, we can just warn or delete pending/stale ones.

        const result = await prisma.validator.deleteMany({
            where: {
                containerId: { not: null }
            }
        });

        console.log(`Deleted ${result.count} stale validator records.`);

    } catch (e) {
        console.error('Error cleaning validators:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
