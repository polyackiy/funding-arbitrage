import axios from 'axios';
import { FundingRate } from '../types';

interface HyperliquidCoin {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

interface HyperliquidFunding {
  dayNtlVlm: string;
  funding: string;
  impactPxs: string[];
  markPx: string;
  midPx: string;
  openInterest: string;
  oraclePx: string;
  premium: string;
  prevDayPx: string;
}

interface HyperliquidMeta {
  universe: HyperliquidCoin[];
}

interface HyperliquidResponse {
  0: HyperliquidMeta;
  1: HyperliquidFunding[];
  length: number;
}

export interface ExtendedFundingRate extends FundingRate {
  dayNtlVlm: number;
  markPx: number;
  openInterest: number;
  oraclePx: number;
  premium: number;
  prevDayPx: number;
  impactPxs: [number | null, number | null];
}

export interface SpreadData {
  symbol: string;
  markPrice: number;
  oraclePrice: number;
  spread: number;
}

export class HyperliquidAPI {
  protected exchangeName = 'Hyperliquid';
  private readonly baseUrl = 'https://api.hyperliquid.xyz';

  async getFundingRates(): Promise<ExtendedFundingRate[]> {
    try {
      const response = await axios.post<HyperliquidResponse>(`${this.baseUrl}/info`, {
        type: "metaAndAssetCtxs"
      });

      if (!Array.isArray(response.data) || response.data.length !== 2) {
        console.error('Invalid response format:', response.data);
        return [];
      }

      const [meta, fundingInfo] = response.data;
      const universe = meta.universe;

      if (!universe || !Array.isArray(fundingInfo)) {
        console.error('Invalid data structure:', { meta, fundingInfo });
        return [];
      }

      const fundingRates: ExtendedFundingRate[] = [];

      universe.forEach((coin: HyperliquidCoin, index: number) => {
        const data = fundingInfo[index];
        if (!data || data.funding === undefined) {
          return;
        }

        try {
          const rate = Number(data.funding);
          if (isNaN(rate)) {
            return;
          }

          const impactPxsArray = Array.isArray(data.impactPxs) ? data.impactPxs : [];
          const impactPxs: [number | null, number | null] = [
            impactPxsArray[0] ? Number(impactPxsArray[0]) : null,
            impactPxsArray[1] ? Number(impactPxsArray[1]) : null
          ];

          fundingRates.push({
            symbol: coin.name,
            rate: rate,
            timestamp: Date.now(),
            dayNtlVlm: Number(data.dayNtlVlm || 0),
            markPx: Number(data.markPx || 0),
            openInterest: Number(data.openInterest || 0),
            oraclePx: Number(data.oraclePx || 0),
            premium: Number(data.premium || 0),
            prevDayPx: Number(data.prevDayPx || 0),
            impactPxs
          });
        } catch (error) {
          console.error(`Error processing ${coin.name}:`, error);
        }
      });

      return fundingRates;
    } catch (error) {
      console.error('Error fetching Hyperliquid funding rates:', error);
      return [];
    }
  }

  async getMarkOracleSpread(): Promise<SpreadData[]> {
    try {
      const response = await axios.post<HyperliquidResponse>(`${this.baseUrl}/info`, {
        type: "metaAndAssetCtxs"
      });

      if (!Array.isArray(response.data) || response.data.length !== 2) {
        console.error('Invalid response format:', response.data);
        return [];
      }

      const [meta, fundingInfo] = response.data;
      const universe = meta.universe;

      if (!universe || !Array.isArray(fundingInfo)) {
        console.error('Invalid data structure:', { meta, fundingInfo });
        return [];
      }

      const spreads: SpreadData[] = [];

      universe.forEach((coin: HyperliquidCoin, index: number) => {
        const data = fundingInfo[index];
        if (!data || !data.markPx || !data.oraclePx) {
          return;
        }

        try {
          const markPrice = Number(data.markPx);
          const oraclePrice = Number(data.oraclePx);
          
          if (isNaN(markPrice) || isNaN(oraclePrice)) {
            return;
          }

          spreads.push({
            symbol: coin.name,
            markPrice,
            oraclePrice,
            spread: ((markPrice - oraclePrice) / oraclePrice) * 10000 // Convert to basis points
          });
        } catch (error) {
          console.error(`Error processing spread for ${coin.name}:`, error);
        }
      });

      return spreads;
    } catch (error) {
      console.error('Error fetching Hyperliquid spreads:', error);
      return [];
    }
  }
}

// Create instance and export functions
const api = new HyperliquidAPI();
export const getHyperliquidMarkOracleSpread = () => api.getMarkOracleSpread();
