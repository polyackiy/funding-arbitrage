import { PrismaClient } from '@prisma/client';
import { fetchFundingRates } from '../worker/funding-rates';
import '../worker/spreads';  // Import spreads worker

const prisma = new PrismaClient();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function main() {
  try {
    console.log('Starting workers...');
    
    while (true) {
      console.log('Fetching funding rates...');
      await fetchFundingRates(prisma);
      console.log('Waiting for next interval...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute interval
    }
  } catch (error) {
    console.error('Error in main worker loop:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
