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

interface HyperliquidResponse {
  type: string;
  data: [
    {
      universe: HyperliquidCoin[];
    },
    HyperliquidFunding[]
  ];
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

export class HyperliquidAPI {
  protected exchangeName = 'Hyperliquid';
  private readonly baseUrl = 'https://api.hyperliquid.xyz';

  async getFundingRates(): Promise<ExtendedFundingRate[]> {
    try {
      const response = await axios.post<HyperliquidResponse>(`${this.baseUrl}/info`, {
        type: "metaAndAssetCtxs"
      });
      
      const fundingRates: ExtendedFundingRate[] = [];
      
      if (Array.isArray(response.data)) {
        const universe = response.data[0]?.universe;
        const fundingInfo = response.data[1];

        if (universe && fundingInfo) {
          universe.forEach((coin, index) => {
            const data = fundingInfo[index];
            
            if (data?.funding !== undefined) {
              const impactPxs = Array.isArray(data.impactPxs) ? [
                data.impactPxs[0] ? Number(data.impactPxs[0]) : null,
                data.impactPxs[1] ? Number(data.impactPxs[1]) : null
              ] : [null, null];

              fundingRates.push({
                symbol: coin.name,
                rate: Number(parseFloat(data.funding).toFixed(6)),
                timestamp: Date.now(),
                dayNtlVlm: Number(data.dayNtlVlm || 0),
                markPx: Number(data.markPx || 0),
                openInterest: Number(data.openInterest || 0),
                oraclePx: Number(data.oraclePx || 0),
                premium: Number(data.premium || 0),
                prevDayPx: Number(data.prevDayPx || 0),
                impactPxs
              });
            }
          });
        }
      }

      return fundingRates;

    } catch (error) {
      console.error('Hyperliquid API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      throw error;
    }
  }
}
