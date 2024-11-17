import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';

export class BybitAPI extends BaseExchangeAPI {
  protected exchangeName = 'Bybit';
  private readonly baseUrl = 'https://api.bybit.com';

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']; // Add more symbols as needed
      const requests = symbols.map(symbol =>
        axios.get(`${this.baseUrl}/v5/market/funding/history`, {
          params: {
            category: 'linear',
            symbol,
            limit: 1
          }
        })
      );

      const responses = await Promise.all(requests);
      
      return responses.map((response, index) => {
        const data = response.data.result.list[0];
        return {
          symbol: symbols[index],
          rate: parseFloat(data.fundingRate),
          timestamp: parseInt(data.fundingRateTimestamp),
        };
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
