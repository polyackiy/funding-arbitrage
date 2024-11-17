import axios from 'axios';
import { BaseExchangeAPI } from './base';
import { FundingRate } from '../types';

interface HyperliquidMetaResponse {
  universe: Array<{
    name: string;
    szabo: string;
  }>;
}

export class HyperliquidAPI extends BaseExchangeAPI {
  protected exchangeName = 'Hyperliquid';
  private readonly baseUrl = 'https://api.hyperliquid.xyz';

  private coinMap: { [key: string]: string } = {
    '1': 'BTC',
    '10': 'ETH',
    '11': 'SOL',
    '12': 'XRP',
    '13': 'BNB',
    // Добавим остальные маппинги по мере необходимости
  };

  async getFundingRates(): Promise<FundingRate[]> {
    try {
      console.log('Fetching Hyperliquid funding rates...');
      
      // Сначала получаем мета-информацию для маппинга ID -> символы
      const metaResponse = await axios.post<HyperliquidMetaResponse>(`${this.baseUrl}/info`, {
        type: "meta"
      });
      
      console.log('Hyperliquid meta response:', metaResponse.data);

      // Обновляем маппинг из мета-данных
      if (metaResponse.data?.universe) {
        metaResponse.data.universe.forEach((asset, index) => {
          this.coinMap[(index + 1).toString()] = asset.name;
        });
      }

      // Получаем текущие фандинг рейты
      const response = await axios.post(`${this.baseUrl}/info`, {
        type: "allMids"
      });
      
      console.log('Hyperliquid funding response:', response.data);

      const fundingRates: FundingRate[] = [];
      
      // Обрабатываем ответ как объект
      for (const [key, value] of Object.entries(response.data)) {
        const coinSymbol = this.coinMap[key.replace('@', '')];
        if (coinSymbol) {
          fundingRates.push({
            symbol: coinSymbol + 'USDT',
            rate: parseFloat(value as string),
            timestamp: Date.now(),
          });
        }
      }

      console.log('Processed funding rates:', fundingRates);
      return fundingRates;

    } catch (error) {
      console.error('Hyperliquid API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      return this.handleError(error);
    }
  }
}
