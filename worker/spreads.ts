const { PrismaClient } = require('@prisma/client');
const { getHyperliquidMarkOracleSpread } = require('../lib/api/exchanges/hyperliquid');
const { getBinanceMarkOracleSpread } = require('../lib/api/exchanges/binance');
const { getBybitMarkOracleSpread } = require('../lib/api/exchanges/bybit');

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
    // Get spreads from all exchanges
    const [hyperliquidSpreads, binanceSpreads, bybitSpreads] = await Promise.all([
      getHyperliquidMarkOracleSpread(),
      getBinanceMarkOracleSpread(),
      getBybitMarkOracleSpread(),
    ]);

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

// Collect spreads every 15 seconds
setInterval(collectSpreads, 15000);

// Initial collection
collectSpreads();
