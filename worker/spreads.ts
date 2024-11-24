import { PrismaClient } from '@prisma/client';
import { getHyperliquidMarkOracleSpread } from '../lib/api/exchanges/hyperliquid';
import { getBinanceMarkOracleSpread } from '../lib/api/exchanges/binance';
import { getBybitMarkOracleSpread } from '../lib/api/exchanges/bybit';

interface SpreadData {
  symbol: string;
  markPrice: number;
  oraclePrice: number;
  spread: number;
}

const prisma = new PrismaClient();

// Function to normalize symbols between exchanges
function normalizeSymbol(symbol: string, exchange: string): string {
  if (exchange === 'binance' || exchange === 'bybit') {
    // Convert '1000PEPE' to 'kPEPE'
    if (symbol.startsWith('1000')) {
      return `k${symbol.slice(4)}`;
    }
  }
  return symbol;
}

async function collectSpreads(): Promise<void> {
  try {
    console.log('Starting to collect spreads...');
    
    // Get spreads from all exchanges
    const [hyperliquidSpreads, binanceSpreads, bybitSpreads] = await Promise.all([
      getHyperliquidMarkOracleSpread().catch(error => {
        console.error('Error fetching Hyperliquid spreads:', error);
        return [];
      }),
      getBinanceMarkOracleSpread().catch(error => {
        console.error('Error fetching Binance spreads:', error);
        return [];
      }),
      getBybitMarkOracleSpread().catch(error => {
        console.error('Error fetching Bybit spreads:', error);
        return [];
      }),
    ]);

    console.log(`Received spreads - Hyperliquid: ${hyperliquidSpreads.length}, Binance: ${binanceSpreads.length}, Bybit: ${bybitSpreads.length}`);

    // Current timestamp
    const timestamp = new Date();

    // Process and save spreads for each exchange
    await Promise.all([
      ...hyperliquidSpreads.map((spread: SpreadData) =>
        prisma.spread.create({
          data: {
            exchange: 'hyperliquid',
            symbol: spread.symbol,
            markPrice: spread.markPrice,
            oraclePrice: spread.oraclePrice,
            spread: spread.spread,
            timestamp
          }
        })
      ),
      ...binanceSpreads.map((spread: SpreadData) =>
        prisma.spread.create({
          data: {
            exchange: 'binance',
            symbol: normalizeSymbol(spread.symbol, 'binance'),
            markPrice: spread.markPrice,
            oraclePrice: spread.oraclePrice,
            spread: spread.spread,
            timestamp
          }
        })
      ),
      ...bybitSpreads.map((spread: SpreadData) =>
        prisma.spread.create({
          data: {
            exchange: 'bybit',
            symbol: normalizeSymbol(spread.symbol, 'bybit'),
            markPrice: spread.markPrice,
            oraclePrice: spread.oraclePrice,
            spread: spread.spread,
            timestamp
          }
        })
      )
    ]);

    console.log(`Successfully collected spreads at ${timestamp.toISOString()}`);
  } catch (error) {
    console.error('Error collecting spreads:', error);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

// Collect spreads every 15 seconds
const INTERVAL = 15000; // 15 seconds
console.log(`Starting spreads collector with ${INTERVAL}ms interval`);
setInterval(collectSpreads, INTERVAL);

// Initial collection
collectSpreads();
