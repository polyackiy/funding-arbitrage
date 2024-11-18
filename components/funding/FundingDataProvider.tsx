import { useEffect, useState, useRef, useCallback } from 'react';
import { HyperliquidAPI } from '@/lib/api/exchanges/hyperliquid';
import { BinanceAPI } from '@/lib/api/exchanges/binance';
import { BybitAPI } from '@/lib/api/exchanges/bybit';
import { CombinedFundingData } from '@/lib/api/types';
import axios from 'axios';

const SPREAD_UPDATE_INTERVAL = 15000; // 15 seconds
const SPREAD_HISTORY_WINDOW = 180000;  // 3 minutes
const SPREAD_SAMPLES_COUNT = SPREAD_HISTORY_WINDOW / SPREAD_UPDATE_INTERVAL; // 12 samples
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

interface SpreadHistory {
  timestamps: number[];
  spreads: number[];
}

interface SpreadData {
  current: number | null;
  average: number | null;
  samplesCount: number;
  isComplete: boolean;
}

export function useFundingData() {
  const [data, setData] = useState<CombinedFundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [spreadHistory, setSpreadHistory] = useState<Record<string, SpreadHistory>>({});
  const [binanceSpreadHistory, setBinanceSpreadHistory] = useState<Record<string, SpreadHistory>>({});
  const [bybitSpreadHistory, setBybitSpreadHistory] = useState<Record<string, { values: number[], timestamps: number[] }>>({});
  const [bybitSpreadData, setBybitSpreadData] = useState<Record<string, SpreadData>>({});
  const [binanceSpreadData, setBinanceSpreadData] = useState<Record<string, SpreadData>>({});
  const retryCount = useRef(0);
  const retryTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);

  const calculateSpread = (markPx: number | null, oraclePx: number | null): number | null => {
    if (markPx === null || oraclePx === null) return null;
    return markPx - oraclePx;
  };

  const updateSpreadHistory = useCallback((
    symbol: string, 
    markPx: number | null, 
    oraclePx: number | null,
    isBinance: boolean = false
  ) => {
    const now = Date.now();
    const currentSpread = calculateSpread(markPx, oraclePx);
    
    const setHistory = isBinance ? setBinanceSpreadHistory : setSpreadHistory;
    
    setHistory(prev => {
      const symbolHistory = prev[symbol] || { timestamps: [], spreads: [] };
      const newHistory = { ...symbolHistory }; // Create a new object to avoid mutating the original
      
      if (currentSpread !== null) {
        newHistory.timestamps = [...newHistory.timestamps, now];
        newHistory.spreads = [...newHistory.spreads, currentSpread];
        console.log(`[${symbol}] Added ${isBinance ? 'Binance' : 'Hyperliquid'} spread: ${currentSpread}, Mark: ${markPx}, Oracle: ${oraclePx}, Total samples: ${newHistory.spreads.length}`);
      }

      const cutoffTime = now - SPREAD_HISTORY_WINDOW;
      const startIndex = newHistory.timestamps.findIndex(t => t > cutoffTime);
      
      const updatedHistory = {
        timestamps: newHistory.timestamps.slice(startIndex),
        spreads: newHistory.spreads.slice(startIndex)
      };

      return {
        ...prev,
        [symbol]: updatedHistory
      };
    });
  }, []);

  const getSpreadData = useCallback((symbol: string, isBinance: boolean = false): SpreadData => {
    const history = isBinance ? binanceSpreadHistory[symbol] : spreadHistory[symbol];
    if (!history || !history.spreads || history.spreads.length === 0) {
      return { 
        current: null, 
        average: null, 
        samplesCount: 0,
        isComplete: false 
      };
    }

    const current = history.spreads[history.spreads.length - 1];
    const average = history.spreads.reduce((a, b) => a + b, 0) / history.spreads.length;
    const isComplete = history.spreads.length >= SPREAD_SAMPLES_COUNT;
    
    return {
      current,
      average,
      samplesCount: history.spreads.length,
      isComplete
    };
  }, [spreadHistory, binanceSpreadHistory]);

  const fetchDataWithRetry = useCallback(async (retryDelay: number = INITIAL_RETRY_DELAY) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    if (timeSinceLastFetch < SPREAD_UPDATE_INTERVAL) {
      console.log(`Skipping fetch, only ${timeSinceLastFetch}ms passed since last fetch`);
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] Fetching data...`);
      lastFetchTime.current = now;

      const hyperliquidApi = new HyperliquidAPI();
      const binanceApi = new BinanceAPI();
      const bybitApi = new BybitAPI();

      const [hyperliquidRates, binanceRates, bybitRates] = await Promise.all([
        hyperliquidApi.getFundingRates(),
        binanceApi.getFundingRates(),
        bybitApi.getFundingRates(),
      ]);

      // Process Hyperliquid data
      const newSpreadHistory = { ...spreadHistory };
      
      hyperliquidRates.forEach((data) => {
        if (data.markPx && data.oraclePx) {
          const markOracleSpread = Math.abs(data.markPx - data.oraclePx);
          const spreadInBps = markOracleSpread / (data.oraclePx / 10000);

          if (!newSpreadHistory[data.symbol]) {
            newSpreadHistory[data.symbol] = {
              timestamps: [],
              spreads: []
            };
          }

          newSpreadHistory[data.symbol].timestamps.push(Date.now());
          newSpreadHistory[data.symbol].spreads.push(spreadInBps);

          // Remove old entries
          const cutoffTime = Date.now() - SPREAD_HISTORY_WINDOW;
          const startIndex = newSpreadHistory[data.symbol].timestamps.findIndex(t => t > cutoffTime);
          
          if (startIndex > 0) {
            newSpreadHistory[data.symbol] = {
              timestamps: newSpreadHistory[data.symbol].timestamps.slice(startIndex),
              spreads: newSpreadHistory[data.symbol].spreads.slice(startIndex)
            };
          }

          console.log(`[${data.symbol}] Added Hyperliquid spread: ${spreadInBps}, Mark: ${data.markPx}, Oracle: ${data.oraclePx}, Total samples: ${newSpreadHistory[data.symbol].spreads.length}`);
        }
      });

      setSpreadHistory(newSpreadHistory);

      // Process Binance data
      const binanceRatesMap = binanceRates.reduce((acc, item) => {
        const normalizedSymbol = item.symbol.replace('USDT', '');
        acc[normalizedSymbol] = item;
        return acc;
      }, {} as Record<string, FundingRate>);

      // Update spread history for Binance
      const newBinanceSpreadHistory = { ...binanceSpreadHistory };
      const newBinanceSpreadData = { ...binanceSpreadData };

      binanceRates.forEach((data) => {
        if (data.markPx && data.oraclePx) {
          const markOracleSpread = Math.abs(data.markPx - data.oraclePx);
          const spreadInBps = markOracleSpread / (data.oraclePx / 10000);
          const normalizedSymbol = data.symbol.replace('USDT', '');
          
          if (!newBinanceSpreadHistory[normalizedSymbol]) {
            newBinanceSpreadHistory[normalizedSymbol] = {
              timestamps: [],
              spreads: []
            };
          }

          newBinanceSpreadHistory[normalizedSymbol].timestamps.push(Date.now());
          newBinanceSpreadHistory[normalizedSymbol].spreads.push(spreadInBps);

          // Remove old entries
          const cutoffTime = Date.now() - SPREAD_HISTORY_WINDOW;
          const startIndex = newBinanceSpreadHistory[normalizedSymbol].timestamps.findIndex(t => t > cutoffTime);
          
          if (startIndex > 0) {
            newBinanceSpreadHistory[normalizedSymbol] = {
              timestamps: newBinanceSpreadHistory[normalizedSymbol].timestamps.slice(startIndex),
              spreads: newBinanceSpreadHistory[normalizedSymbol].spreads.slice(startIndex)
            };
          }

          const values = newBinanceSpreadHistory[normalizedSymbol].spreads;
          newBinanceSpreadData[normalizedSymbol] = {
            current: spreadInBps,
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            samplesCount: values.length,
            isComplete: values.length >= SPREAD_SAMPLES_COUNT,
          };
        }
      });

      setBinanceSpreadHistory(newBinanceSpreadHistory);
      setBinanceSpreadData(newBinanceSpreadData);

      // Process Bybit data
      const bybitRatesMap = bybitRates.reduce((acc, item) => {
        acc[item.symbol] = item;
        return acc;
      }, {} as Record<string, FundingRate>);

      // Update spread history for Bybit
      const newBybitSpreadHistory = { ...bybitSpreadHistory };
      const newBybitSpreadData = { ...bybitSpreadData };

      bybitRates.forEach((data) => {
        if (data.markPx && data.oraclePx) {
          const markOracleSpread = Math.abs(data.markPx - data.oraclePx);
          const spreadInBps = markOracleSpread / (data.oraclePx / 10000);
          
          if (!newBybitSpreadHistory[data.symbol]) {
            newBybitSpreadHistory[data.symbol] = {
              values: [],
              timestamps: []
            };
          }

          newBybitSpreadHistory[data.symbol].values.push(spreadInBps);
          newBybitSpreadHistory[data.symbol].timestamps.push(Date.now());

          // Remove old entries
          while (
            newBybitSpreadHistory[data.symbol].timestamps.length > 0 &&
            Date.now() - newBybitSpreadHistory[data.symbol].timestamps[0] > SPREAD_HISTORY_WINDOW
          ) {
            newBybitSpreadHistory[data.symbol].values.shift();
            newBybitSpreadHistory[data.symbol].timestamps.shift();
          }

          const values = newBybitSpreadHistory[data.symbol].values;
          newBybitSpreadData[data.symbol] = {
            current: spreadInBps,
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            samplesCount: values.length,
            isComplete: values.length >= SPREAD_SAMPLES_COUNT,
          };
        }
      });

      setBybitSpreadHistory(newBybitSpreadHistory);
      setBybitSpreadData(newBybitSpreadData);

      const combinedData: CombinedFundingData[] = hyperliquidRates.map(hl => {
        const spreadData = getSpreadData(hl.symbol);

        // Find corresponding Binance data using normalized symbol (without USDT)
        const binanceRate = binanceRatesMap[hl.symbol];

        // Find corresponding Bybit data
        const bybitRate = bybitRatesMap[hl.symbol];

        return {
          symbol: hl.symbol,
          rates: {
            hyperliquid: hl.rate,
            binance: binanceRate?.rate ?? null,
            bybit: bybitRate?.rate ?? null,
            dayNtlVlm: hl.dayNtlVlm,
            markPx: hl.markPx,
            openInterest: hl.openInterest,
            oraclePx: hl.oraclePx,
            premium: hl.premium,
            prevDayPx: hl.prevDayPx,
            impactPxs: hl.impactPxs,
            binanceSpreadData: newBinanceSpreadData[hl.symbol],
            bybitSpreadData: newBybitSpreadData[hl.symbol],
            spreadData,
          },
        };
      });

      setData(combinedData);
      setLastUpdate(now);
      setError(null);
      setLoading(false);
      retryCount.current = 0;

    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const nextRetryDelay = retryDelay * 2;
        
        if (retryCount.current < MAX_RETRIES) {
          console.log(`Rate limit exceeded. Retrying in ${retryDelay/1000} seconds...`);
          retryCount.current += 1;
          
          if (retryTimeoutId.current) {
            clearTimeout(retryTimeoutId.current);
          }
          
          retryTimeoutId.current = setTimeout(() => {
            fetchDataWithRetry(nextRetryDelay);
          }, retryDelay);
          
        } else {
          setError('Rate limit exceeded. Please try again later.');
          retryCount.current = 0;
        }
      } else {
        setError('Failed to fetch data');
      }
      setLoading(false);
    }
  }, [updateSpreadHistory, getSpreadData, bybitSpreadHistory, bybitSpreadData, binanceSpreadHistory, binanceSpreadData]);

  useEffect(() => {
    console.log('Starting data collection...');
    fetchDataWithRetry();

    let intervalId: NodeJS.Timeout | null = null;
    let progressIntervalId: NodeJS.Timeout | null = null;

    if (!isPaused) {
      intervalId = setInterval(() => {
        fetchDataWithRetry();
      }, SPREAD_UPDATE_INTERVAL);

      progressIntervalId = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        const progressValue = Math.min(100, (timeSinceLastUpdate / SPREAD_UPDATE_INTERVAL) * 100);
        setProgress(progressValue);
      }, 1000);
    }

    return () => {
      console.log('Cleaning up intervals...');
      if (intervalId) clearInterval(intervalId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      if (retryTimeoutId.current) clearTimeout(retryTimeoutId.current);
    };
  }, [isPaused, fetchDataWithRetry]);

  return { 
    data, 
    loading, 
    error, 
    progress, 
    isPaused, 
    setIsPaused 
  };
}
