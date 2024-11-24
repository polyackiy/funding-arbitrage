import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

// How many days of data to keep
const RETENTION_DAYS = 7;

async function cleanup() {
  try {
    console.log('Starting cleanup...');
    const cutoffDate = subDays(new Date(), RETENTION_DAYS);
    
    // Cleanup old spread data
    const deletedSpreads = await prisma.spread.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
    console.log(`Deleted ${deletedSpreads.count} old spread records`);

    // Cleanup old funding rate data
    const deletedFundingRates = await prisma.fundingRate.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
    console.log(`Deleted ${deletedFundingRates.count} old funding rate records`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run cleanup every day
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
console.log(`Starting cleanup worker with ${CLEANUP_INTERVAL}ms interval`);
setInterval(cleanup, CLEANUP_INTERVAL);

// Initial cleanup
cleanup();

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});
