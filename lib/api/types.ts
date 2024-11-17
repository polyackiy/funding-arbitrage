export interface FundingRate {
  symbol: string;
  rate: number;
  timestamp: number;
}

export interface ExchangeData {
  exchange: 'Hyperliquid' | 'Binance' | 'Bybit';
  fundingRates: FundingRate[];
}

export interface CombinedFundingData {
  symbol: string;
  hyperliquid?: number;
  binance?: number;
  bybit?: number;
  timestamp: number;
}
