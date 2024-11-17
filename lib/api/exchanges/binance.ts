import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';

export class BinanceAPI extends BaseExchangeAPI {
  protected exchangeName = 'Binance';
  private readonly baseUrl = 'https://fapi.binance.com';

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/premiumIndex`);
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        rate: parseFloat(item.lastFundingRate),
        timestamp: Date.now(),
      }));
    } catch (error) {
      return this.handleError(error);
    }
  }
}
