const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldSpreads(): Promise<void> {
  try {
    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Delete all records older than 24 hours
    const deletedCount = await prisma.spread.deleteMany({
      where: {
        timestamp: {
          lt: oneDayAgo
        }
      }
    });

    console.log(`Successfully deleted ${deletedCount.count} old spread records at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error cleaning up old spreads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupOldSpreads();
