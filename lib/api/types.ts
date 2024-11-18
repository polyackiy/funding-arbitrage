export interface FundingRate {
  symbol: string;
  rate: number;
  timestamp: number;
  markPx?: number;
  oraclePx?: number;
}

export interface CombinedFundingData {
  symbol: string;
  rates: {
    hyperliquid: number | null;
    binance: number | null;
    bybit: number | null;
    dayNtlVlm: number | null;
    markPx: number | null;
    openInterest: number | null;
    oraclePx: number | null;
    premium: number | null;
    prevDayPx: number | null;
    impactPxs: [number | null, number | null];
    binanceSpreadData?: SpreadData;
    bybitSpreadData?: SpreadData;
    spreadData?: SpreadData;
  };
}

export interface SpreadData {
  current: number | null;
  average: number | null;
  samplesCount: number;
  isComplete: boolean;
}
