import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get spreads for the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    // Get all unique symbols
    const symbols = await prisma.spread.findMany({
      where: {
        timestamp: {
          gte: thirtySecondsAgo,
        },
      },
      select: {
        symbol: true,
      },
      distinct: ['symbol'],
    });

    const result: Record<string, any> = {};

    // For each symbol, get average spreads from each exchange
    for (const { symbol } of symbols) {
      result[symbol] = {};

      // Get data for each exchange
      for (const exchange of ['hyperliquid', 'binance', 'bybit']) {
        const spreads = await prisma.spread.findMany({
          where: {
            symbol,
            exchange,
            timestamp: {
              gte: thirtySecondsAgo,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        });

        if (spreads.length > 0) {
          // Calculate average spread
          const avgSpread = spreads.reduce((sum, s) => sum + Number(s.spread), 0) / spreads.length;
          
          // Get the most recent mark and oracle prices
          const latest = spreads[0];

          result[symbol][exchange] = {
            average: avgSpread,
            current: Number(latest.spread),
            markPrice: Number(latest.markPrice),
            oraclePrice: Number(latest.oraclePrice),
          };
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching spreads:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
