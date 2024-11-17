import { FundingRate } from '../types';

export abstract class BaseExchangeAPI {
  protected abstract exchangeName: string;
  
  abstract getFundingRates(): Promise<FundingRate[]>;
  
  protected handleError(error: unknown): never {
    console.error(`${this.exchangeName} API Error:`, error);
    throw error;
  }
}
