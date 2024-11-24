import { FundingRate } from '../types';
import { SpreadData } from './hyperliquid';
import axios from 'axios';

export abstract class BaseExchangeAPI {
  protected abstract exchangeName: string;
  
  abstract getFundingRates(): Promise<FundingRate[]>;
  abstract getMarkOracleSpread(): Promise<SpreadData[]>;
  
  protected handleError<T>(error: unknown): T[] {
    console.error(`${this.exchangeName} API Error:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', error.response?.data);
    }
    return [];
  }
}
