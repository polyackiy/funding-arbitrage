import { useEffect, useState } from 'react';
import { BinanceAPI } from '@/lib/api/exchanges/binance';
import { HyperliquidAPI } from '@/lib/api/exchanges/hyperliquid';
import { BybitAPI } from '@/lib/api/exchanges/bybit';
import { CombinedFundingData } from '@/lib/api/types';
import { Progress } from "@/components/ui/progress"

const UPDATE_INTERVAL = 30000; // 30 seconds
const RETRY_DELAY = 5000; // 5 секунд задержки при ошибке

// Нормализация символов для сопоставления между биржами
function normalizeSymbol(symbol: string): string {
  // Убираем 'USDT' и 'PERP' из символа и добавляем 'USDT' обратно
  return symbol.replace(/(USDT|PERP)$/, '') + 'USDT';
}

export function useFundingData() {
  const [data, setData] = useState<CombinedFundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [progress, setProgress] = useState(100);

  const fetchData = async () => {
    try {
      // Проверяем, прошло ли достаточно времени с последнего обновления
      const now = Date.now();
      if (now - lastUpdate < UPDATE_INTERVAL) {
        return;
      }

      console.log('Fetching data from all exchanges...');
      
      const binanceApi = new BinanceAPI();
      const hyperliquidApi = new HyperliquidAPI();
      const bybitApi = new BybitAPI();

      // Добавляем небольшую задержку между запросами
      const binanceRates = await binanceApi.getFundingRates();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const hyperliquidRates = await hyperliquidApi.getFundingRates();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const bybitRates = await bybitApi.getFundingRates();

      // Нормализуем символы для всех бирж
      const normalizedBinance = binanceRates.map(r => ({
        ...r,
        symbol: normalizeSymbol(r.symbol)
      }));
      
      const normalizedHyperliquid = hyperliquidRates.map(r => ({
        ...r,
        symbol: normalizeSymbol(r.symbol)
      }));
      
      const normalizedBybit = bybitRates.map(r => ({
        ...r,
        symbol: normalizeSymbol(r.symbol)
      }));

      // Создаем множество всех символов
      const symbolsSet = new Set([
        ...normalizedBinance.map(r => r.symbol),
        ...normalizedHyperliquid.map(r => r.symbol),
        ...normalizedBybit.map(r => r.symbol),
      ]);

      // Комбинируем данные
      const combinedData: CombinedFundingData[] = Array.from(symbolsSet).map(symbol => {
        const binance = normalizedBinance.find(r => r.symbol === symbol);
        const hyperliquid = normalizedHyperliquid.find(r => r.symbol === symbol);
        const bybit = normalizedBybit.find(r => r.symbol === symbol);

        return {
          symbol,
          binance: binance?.rate,
          hyperliquid: hyperliquid?.rate,
          bybit: bybit?.rate,
          timestamp: now,
        };
      });

      setData(combinedData);
      setError(null);
      setLastUpdate(now);
      setProgress(100);
    } catch (err) {
      console.error('Error fetching funding rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch funding rates');
      // При ошибке пробуем через 5 секунд
      setTimeout(fetchData, RETRY_DELAY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, UPDATE_INTERVAL);

    // Обновляем прогресс каждую секунду
    const progressInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;
      const newProgress = Math.max(0, 100 - (timeSinceLastUpdate / UPDATE_INTERVAL * 100));
      setProgress(newProgress);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [lastUpdate]);

  return { data, loading, error, lastUpdate, progress, UPDATE_INTERVAL };
}
