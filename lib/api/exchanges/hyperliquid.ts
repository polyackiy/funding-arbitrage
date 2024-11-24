import axios from 'axios';
import { FundingRate } from '../types';
import { BaseExchangeAPI } from './base';

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

export class HyperliquidAPI extends BaseExchangeAPI {
  protected exchangeName = 'Hyperliquid';
  private readonly baseUrl = 'https://api.hyperliquid.xyz';

  async getFundingRates(): Promise<ExtendedFundingRate[]> {
    try {
      console.log('Fetching funding rates from Hyperliquid...');
      const response = await axios.post<HyperliquidResponse>(`${this.baseUrl}/info`, {
        type: "metaAndAssetCtxs"
      });

      console.log('Received response from Hyperliquid:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });

      if (!Array.isArray(response.data) || response.data.length !== 2) {
        console.error('Invalid response format:', response.data);
        return this.handleError<ExtendedFundingRate>(new Error('Invalid response format'));
      }

      const [meta, fundingInfo] = response.data;
      const universe = meta.universe;

      if (!universe || !Array.isArray(fundingInfo)) {
        console.error('Invalid data structure:', { meta, fundingInfo });
        return this.handleError<ExtendedFundingRate>(new Error('Invalid data structure'));
      }

      const fundingRates: ExtendedFundingRate[] = [];

      for (let i = 0; i < universe.length; i++) {
        const coin = universe[i];
        const data = fundingInfo[i];
        if (!data || data.funding === undefined) {
          continue;
        }

        try {
          const rate = Number(data.funding);
          if (isNaN(rate)) {
            continue;
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
          if (error instanceof Error) {
            console.error(`Error processing ${coin.name}:`, error.message, '\nStack:', error.stack);
          } else {
            console.error(`Error processing ${coin.name}:`, error);
          }
        }
      }

      return fundingRates;
    } catch (error) {
      return this.handleError<ExtendedFundingRate>(error);
    }
  }

  async getMarkOracleSpread(): Promise<SpreadData[]> {
    try {
      console.log('Fetching mark/oracle spreads from Hyperliquid...');
      const response = await axios.post<HyperliquidResponse>(`${this.baseUrl}/info`, {
        type: "metaAndAssetCtxs"
      });

      console.log('Received response from Hyperliquid:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });

      if (!Array.isArray(response.data) || response.data.length !== 2) {
        console.error('Invalid response format:', response.data);
        return this.handleError<SpreadData>(new Error('Invalid response format'));
      }

      const [meta, fundingInfo] = response.data;
      const universe = meta.universe;

      if (!universe || !Array.isArray(fundingInfo)) {
        console.error('Invalid data structure:', { meta, fundingInfo });
        return this.handleError<SpreadData>(new Error('Invalid data structure'));
      }

      const spreads: SpreadData[] = [];

      for (let i = 0; i < universe.length; i++) {
        const coin = universe[i];
        const data = fundingInfo[i];
        if (!data || !data.markPx || !data.oraclePx) {
          continue;
        }

        try {
          const markPrice = Number(data.markPx);
          const oraclePrice = Number(data.oraclePx);
          
          if (isNaN(markPrice) || isNaN(oraclePrice)) {
            continue;
          }

          spreads.push({
            symbol: coin.name,
            markPrice,
            oraclePrice,
            spread: ((markPrice - oraclePrice) / oraclePrice) * 10000 // Convert to basis points
          });
        } catch (error) {
          if (error instanceof Error) {
            console.error(`Error processing spread for ${coin.name}:`, error.message, '\nStack:', error.stack);
          } else {
            console.error(`Error processing spread for ${coin.name}:`, error);
          }
        }
      }

      return spreads;
    } catch (error) {
      return this.handleError<SpreadData>(error);
    }
  }
}

// Create instance and export functions
const api = new HyperliquidAPI();
export const getHyperliquidMarkOracleSpread = () => api.getMarkOracleSpread();
