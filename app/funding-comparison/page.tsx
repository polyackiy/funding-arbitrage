'use client';

import { FundingTable } from '@/components/funding/FundingTable';
import { useFundingData } from '@/components/funding/FundingDataProvider';
import { useRouter } from 'next/navigation';

export default function FundingComparison() {
  const router = useRouter();
  const { data, loading, error, progress, isPaused, setIsPaused } = useFundingData();
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  const handleOrderPlacement = (symbol: string, exchanges: string[]) => {
    router.push(`/order-placement?symbol=${symbol}&exchanges=${exchanges.join(',')}`);
  };

  return (
    <div className="container mx-0 sm:mx-auto py-4 sm:py-10 px-1 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Funding Comparison</h1>
      <FundingTable 
        data={data} 
        onOrderPlacement={handleOrderPlacement} 
        progress={progress}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />
    </div>
  );
}
