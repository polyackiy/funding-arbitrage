import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';
import { SpreadData } from './hyperliquid';

interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  time: number;
}

interface BinanceMarkPrice {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
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
      return this.handleError<FundingRate>(error);
    }
  }

  async getMarkOracleSpread(): Promise<SpreadData[]> {
    try {
      const response = await axios.get<BinanceMarkPrice[]>(`${this.baseUrl}/fapi/v1/premiumIndex`);
      
      return response.data.map(item => {
        const markPrice = Number(item.markPrice);
        const oraclePrice = Number(item.indexPrice);
        
        return {
          symbol: item.symbol.replace('USDT', ''),  // Convert BTCUSDT to BTC
          markPrice,
          oraclePrice,
          spread: ((markPrice - oraclePrice) / oraclePrice) * 10000 // Convert to basis points
        };
      });
    } catch (error) {
      return this.handleError<SpreadData>(error);
    }
  }

  // Helper method to convert Hyperliquid symbol to Binance symbol
  static convertSymbol(symbol: string): string {
    return `${symbol}USDT`;
  }
}

// Create instance and export functions
const api = new BinanceAPI();
export const getBinanceMarkOracleSpread = () => api.getMarkOracleSpread();
