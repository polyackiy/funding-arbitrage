import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';
import { SpreadData } from './hyperliquid';

// Interface for funding rates endpoint
interface BybitFundingTicker {
  symbol: string;
  lastPrice: string;
  indexPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: string;
}

// Interface for tickers endpoint
interface BybitTickerForSpread {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: string;
  predictedFundingRate: string;
  fundingRateTimestamp: string;
}

interface BybitFundingResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitFundingTicker[];
  };
  retExtInfo: {};
  time: number;
}

interface BybitTickerResponse {
  retCode: number;
  retMsg: string;
  result: {
    category: string;
    list: BybitTickerForSpread[];
  };
  retExtInfo: {};
  time: number;
}

export class BybitAPI extends BaseExchangeAPI {
  protected exchangeName = 'Bybit';
  private readonly baseUrl = 'https://api.bybit.com';

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await axios.get<BybitFundingResponse>(`${this.baseUrl}/v5/market/tickers`, {
        params: {
          category: 'linear'
        }
      });

      if (response.data.retCode === 0 && response.data.result.list) {
        return response.data.result.list.map(item => {
          // Bybit returns funding rate as a percentage for 8 hours
          // We need to:
          // 1. Convert from percentage to decimal (divide by 100)
          // 2. Convert to hourly rate (divide by 8)
          // 3. Scale to match other exchanges (multiply by 100)
          const fundingRate = Number(item.fundingRate);
          
          return {
            symbol: this.normalizeSymbol(item.symbol),
            rate: fundingRate / 8, // Already in percentage, just convert to hourly rate
            timestamp: Date.now()
          };
        });
      }

      return [];
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMarkOracleSpread(): Promise<SpreadData[]> {
    try {
      const response = await axios.get<BybitTickerResponse>(`${this.baseUrl}/v5/market/tickers`, {
        params: {
          category: 'linear'
        }
      });
      
      if (response.data.retCode === 0 && response.data.result.list) {
        return response.data.result.list.map(item => {
          const markPrice = Number(item.markPrice);
          const oraclePrice = Number(item.indexPrice);
          
          return {
            symbol: this.normalizeSymbol(item.symbol),
            markPrice,
            oraclePrice,
            spread: ((markPrice - oraclePrice) / oraclePrice) * 10000 // Convert to basis points
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Bybit API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      return [];
    }
  }

  // Helper method to convert Hyperliquid symbol to Bybit symbol
  static convertSymbol(symbol: string): string {
    return `${symbol}USDT`;
  }

  private normalizeSymbol(symbol: string): string {
    return symbol.replace('USDT', '');
  }
}

// Create instance and export functions
const api = new BybitAPI();
export const getBybitMarkOracleSpread = () => api.getMarkOracleSpread();
