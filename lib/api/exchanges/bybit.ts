import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';

interface BybitTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: string;
}

interface BybitResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTicker[];
  };
}

export class BybitAPI extends BaseExchangeAPI {
  protected exchangeName = 'Bybit';
  private readonly baseUrl = 'https://api.bybit.com';

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await axios.get<BybitResponse>(`${this.baseUrl}/v5/market/tickers`, {
        params: {
          category: 'linear'  // USDT perpetual
        }
      });

      return response.data.result.list.map(item => ({
        symbol: this.normalizeSymbol(item.symbol),  // Convert BTCUSDT to BTC
        rate: parseFloat(item.fundingRate) / 8,  // Normalize to hourly rate (Bybit funding is 8-hourly)
        markPx: parseFloat(item.markPrice),
        oraclePx: parseFloat(item.indexPrice),
        timestamp: Date.now(),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper method to convert Hyperliquid symbol to Bybit symbol
  static convertSymbol(symbol: string): string {
    return `${symbol}USDT`;
  }

  // Helper method to convert Bybit symbol to normalized symbol
  private normalizeSymbol(symbol: string): string {
    return symbol.replace('USDT', '');
  }
}
