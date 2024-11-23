import { useEffect, useState, useRef } from 'react';
import { HyperliquidAPI } from '@/lib/api/exchanges/hyperliquid';
import { BinanceAPI } from '@/lib/api/exchanges/binance';
import { BybitAPI } from '@/lib/api/exchanges/bybit';
import { CombinedFundingData } from '@/lib/api/types';
import axios from 'axios';

const SPREAD_UPDATE_INTERVAL = 9000; // 9 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

export function useFundingData() {
  const [data, setData] = useState<CombinedFundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const retryCount = useRef(0);
  const retryTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);

  const fetchDataWithRetry = async (retryDelay: number = INITIAL_RETRY_DELAY) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    if (timeSinceLastFetch < SPREAD_UPDATE_INTERVAL) {
      return;
    }

    try {
      lastFetchTime.current = now;

      const hyperliquidApi = new HyperliquidAPI();
      const binanceApi = new BinanceAPI();
      const bybitApi = new BybitAPI();

      const [hyperliquidRates, binanceRates, bybitRates, spreadsResponse] = await Promise.all([
        hyperliquidApi.getFundingRates(),
        binanceApi.getFundingRates(),
        bybitApi.getFundingRates(),
        fetch('/api/spreads').then(res => res.json())
      ]);

      const binanceRatesMap = binanceRates.reduce((acc, item) => {
        const normalizedSymbol = item.symbol.replace('USDT', '');
        acc[normalizedSymbol] = item;
        return acc;
      }, {} as Record<string, any>);

      const bybitRatesMap = bybitRates.reduce((acc, item) => {
        acc[item.symbol] = item;
        return acc;
      }, {} as Record<string, any>);

      // Use Hyperliquid rates as the base for available symbols
      const combinedData: CombinedFundingData[] = hyperliquidRates.map(hyperliquidRate => {
        const symbol = hyperliquidRate.symbol;
        const exchangeData = spreadsResponse[symbol] || {};

        // Handle k-prefixed symbols
        let binanceSymbol = symbol;
        let bybitSymbol = symbol;
        
        if (symbol.startsWith('k')) {
          // Remove 'k' prefix and add '1000' prefix for Binance/Bybit
          const baseSymbol = symbol.slice(1); // Remove 'k'
          binanceSymbol = `1000${baseSymbol}`;
          bybitSymbol = `1000${baseSymbol}`;
        }

        return {
          symbol,
          rates: {
            hyperliquid: hyperliquidRate.rate,
            binance: binanceRatesMap[binanceSymbol]?.rate ?? null,
            bybit: bybitRatesMap[bybitSymbol]?.rate ?? null,
            dayNtlVlm: hyperliquidRate.dayNtlVlm,
            markPx: hyperliquidRate.markPx,
            openInterest: hyperliquidRate.openInterest,
            oraclePx: hyperliquidRate.oraclePx,
            premium: hyperliquidRate.premium,
            prevDayPx: hyperliquidRate.prevDayPx,
            impactPxs: hyperliquidRate.impactPxs,
            spreadData: exchangeData.hyperliquid ?? null,
            binanceSpreadData: exchangeData.binance ?? null,
            bybitSpreadData: exchangeData.bybit ?? null,
          },
        };
      });

      setData(combinedData);
      setLastUpdate(now);
      setError(null);
      setLoading(false);
      retryCount.current = 0;

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setLoading(false);

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        const nextRetryDelay = retryDelay * 2;
        
        if (retryTimeoutId.current) {
          clearTimeout(retryTimeoutId.current);
        }
        
        retryTimeoutId.current = setTimeout(() => {
          fetchDataWithRetry(nextRetryDelay);
        }, retryDelay);
      }
    }
  };

  useEffect(() => {
    fetchDataWithRetry();
    
    if (!isPaused) {
      const interval = setInterval(fetchDataWithRetry, SPREAD_UPDATE_INTERVAL);
      
      return () => {
        clearInterval(interval);
        if (retryTimeoutId.current) {
          clearTimeout(retryTimeoutId.current);
        }
      };
    }
  }, [isPaused]);

  return { 
    data, 
    loading, 
    error,
    isPaused,
    setIsPaused
  };
}
