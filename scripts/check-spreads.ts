import { PrismaClient, Spread } from '@prisma/client';

interface SpreadRecord {
  id: number;
  timestamp: Date;
  symbol: string;
  exchange: string;
  spread: number;
  markPrice: number;
  oraclePrice: number;
}

const prisma = new PrismaClient();

async function checkSpreads(): Promise<void> {
  try {
    // Get the latest 5 records
    const latestSpreads: Spread[] = await prisma.spread.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (latestSpreads.length > 0) {
      console.log('Latest spread records:');
      latestSpreads.forEach((spread: Spread) => {
        console.log(`[${spread.timestamp.toISOString()}] ${spread.exchange} - ${spread.symbol}: ${Number(spread.spread)}`);
      });
      
      // Show time since last record
      const lastRecord: Spread = latestSpreads[0];
      const timeSinceLastRecord = Date.now() - lastRecord.timestamp.getTime();
      const minutesSinceLastRecord = Math.floor(timeSinceLastRecord / (1000 * 60));
      
      console.log(`\nTime since last record: ${minutesSinceLastRecord} minutes`);
      
      if (minutesSinceLastRecord > 5) {
        console.log('\nWARNING: No new records in the last 5 minutes!');
      }
    } else {
      console.log('No spread records found');
    }
  } catch (error) {
    console.error('Error checking spreads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpreads();
