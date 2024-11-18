import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';

interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  time: number;
}

export class BinanceAPI extends BaseExchangeAPI {
  protected exchangeName = 'Binance';
  private readonly baseUrl = 'https://fapi.binance.com';

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await axios.get<BinancePremiumIndex[]>(`${this.baseUrl}/fapi/v1/premiumIndex`);
      return response.data.map((item) => ({
        symbol: item.symbol.replace('USDT', ''),  // Convert BTCUSDT to BTC
        // Делим на 8, так как на Binance фандинг взимается каждые 8 часов
        rate: parseFloat(item.lastFundingRate) / 8,
        markPx: parseFloat(item.markPrice),
        oraclePx: parseFloat(item.indexPrice),
        timestamp: item.time,
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper method to convert Hyperliquid symbol to Binance symbol
  static convertSymbol(symbol: string): string {
    return `${symbol}USDT`;
  }
}
