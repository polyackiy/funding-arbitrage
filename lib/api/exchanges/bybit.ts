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
      const response = await axios.get<BybitFundingResponse>(
        `${this.baseUrl}/v5/market/tickers`,
        {
          params: {
            category: 'linear'
          }
        }
      );

      if (response.data.retCode !== 0) {
        throw new Error(`Bybit API error: ${response.data.retMsg}`);
      }

      return response.data.result.list.map(item => ({
        symbol: item.symbol.replace('USDT', ''),
        rate: parseFloat(item.fundingRate) / 8, // Already in percentage, just convert to hourly rate
        timestamp: Date.now(),
      }));
    } catch (error) {
      return this.handleError<FundingRate>(error);
    }
  }

  async getMarkOracleSpread(): Promise<SpreadData[]> {
    try {
      const response = await axios.get<BybitTickerResponse>(
        `${this.baseUrl}/v5/market/tickers`,
        {
          params: {
            category: 'linear'
          }
        }
      );

      if (response.data.retCode !== 0) {
        throw new Error(`Bybit API error: ${response.data.retMsg}`);
      }

      return response.data.result.list.map(item => {
        const markPrice = Number(item.markPrice);
        const oraclePrice = Number(item.indexPrice);

        return {
          symbol: item.symbol.replace('USDT', ''),
          markPrice,
          oraclePrice,
          spread: ((markPrice - oraclePrice) / oraclePrice) * 10000 // Convert to basis points
        };
      });
    } catch (error) {
      return this.handleError<SpreadData>(error);
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
