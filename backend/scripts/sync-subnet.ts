
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const OLD_SUBNET_ID = 'subnet1765897075908';
  const NEW_SUBNET_ID = 'subnet1765889840094';

  console.log(`Starting migration from ${OLD_SUBNET_ID} to ${NEW_SUBNET_ID}...`);

  try {
    // 1. Check if the old subnet exists
    const oldSubnet = await prisma.network.findUnique({
      where: { id: OLD_SUBNET_ID },
    });

    if (!oldSubnet) {
      console.log(`Old subnet ${OLD_SUBNET_ID} not found in database. Checking for new subnet...`);
      const newSubnet = await prisma.network.findUnique({
        where: { id: NEW_SUBNET_ID },
      });

      if (newSubnet) {
        console.log(`Target subnet ${NEW_SUBNET_ID} already exists. No action needed.`);
      } else {
        console.error(`Neither old nor new subnet found. Manual investigation required.`);
      }
      return;
    }

    console.log(`Found old subnet: ${oldSubnet.name} (${oldSubnet.status})`);

    // 2. Check if target ID already exists (collision check)
    const existingTarget = await prisma.network.findUnique({
      where: { id: NEW_SUBNET_ID },
    });

    if (existingTarget) {
      console.warn(`Target subnet ${NEW_SUBNET_ID} already exists! Deleting old subnet instead of update to avoid collision.`);
      // Delete old one
      await prisma.network.delete({
        where: { id: OLD_SUBNET_ID },
      });
      console.log(`Deleted old subnet ${OLD_SUBNET_ID}.`);
      return;
    }

    // 3. Update the subnet ID
    // Prisma doesn't support updating the ID field directly easily if there are relations, 
    // but CASCADE is set in schema for relations. 
    // actually, updating ID on a model with relations can be tricky.
    // Let's try creating new and deleting old, OR raw query.
    // Raw query is safer/easier for ID swap.

    console.log('Executing raw SQL update...');

    // Update Network table
    const result = await prisma.$executeRaw`UPDATE "Network" SET id = ${NEW_SUBNET_ID}, "subnetId" = ${NEW_SUBNET_ID} WHERE id = ${OLD_SUBNET_ID}`;

    console.log(`Updated ${result} network record(s).`);

    // Verify
    const updated = await prisma.network.findUnique({
      where: { id: NEW_SUBNET_ID },
    });

    if (updated) {
      console.log(`SUCCESS: Network records migrated to ${NEW_SUBNET_ID}`);
      console.log(`Name: ${updated.name}, Status: ${updated.status}`);
    } else {
      console.error('FAILED: Could not find record after update.');
    }

  } catch (e) {
    console.error('Error during migration:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
