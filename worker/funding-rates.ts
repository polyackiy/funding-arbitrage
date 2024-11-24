import { PrismaClient } from '@prisma/client';
import axios from 'axios';

interface FundingRate {
  symbol: string;
  exchange: string;
  fundingRate: number;
  timestamp: Date;
}

export async function fetchFundingRates(prisma: PrismaClient): Promise<void> {
  try {
    // Fetch funding rates from Binance
    const response = await axios.get('https://fapi.binance.com/fapi/v1/fundingRate');
    console.log('Binance API response:', response.data);

    const fundingRates: FundingRate[] = response.data.map((item: any) => ({
      symbol: item.symbol,
      exchange: 'binance',
      fundingRate: parseFloat(item.fundingRate),
      timestamp: new Date(item.fundingTime)
    }));

    // Store funding rates in database
    for (const rate of fundingRates) {
      await prisma.fundingRate.create({
        data: {
          symbol: rate.symbol,
          exchange: rate.exchange,
          rate: rate.fundingRate,
          timestamp: rate.timestamp
        }
      });
    }

    console.log(`Successfully stored ${fundingRates.length} funding rates`);
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    throw error;
  }
}
