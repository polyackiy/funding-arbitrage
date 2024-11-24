import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { CombinedFundingData } from '@/lib/api/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, Pin } from 'lucide-react';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

interface FundingTableProps {
  data: CombinedFundingData[];
  onOrderPlacement: (symbol: string, exchanges: string[]) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export function FundingTable({ 
  data, 
  onOrderPlacement,
  isPaused, 
  setIsPaused 
}: FundingTableProps) {
  const [selectedExchanges, setSelectedExchanges] = useState<{[key: string]: string[]}>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);
  const [hideTrash, setHideTrash] = useState(true);
  const [pinnedSymbols, setPinnedSymbols] = useLocalStorage<Set<string>>("pinnedSymbols", new Set());

  const formatRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    // Convert hourly rate to annual (24 hours * 365 days)
    const annualRate = rate * 24 * 365;
    return `${(annualRate * 100).toFixed(2)}%`;
  };

  const calculateSpread = (impactPxs: [number | undefined, number | undefined] | undefined) => {
    if (!impactPxs) return null;
    const [buyPrice, sellPrice] = impactPxs;
    if (typeof buyPrice !== 'number' || typeof sellPrice !== 'number') return null;
    // Calculate spread in basis points: (sellPrice - buyPrice) / sellPrice * 10000
    return ((sellPrice - buyPrice) / sellPrice) * 10000;
  };

  const formatSpread = (spread: number | null | undefined) => {
    if (spread === null || spread === undefined) return 'N/A';
    return Math.round(spread).toString();
  };

  const handlePinToggle = (symbol: string) => {
    const newPinnedSymbols = new Set(pinnedSymbols);
    if (newPinnedSymbols.has(symbol)) {
      newPinnedSymbols.delete(symbol);
    } else {
      newPinnedSymbols.add(symbol);
    }
    setPinnedSymbols(newPinnedSymbols);
  };

  // Sort data before passing it to the table
  const sortedData = useMemo(() => {
    // Create a Map to store the original order of pinned items
    const pinnedOrder = new Map([...pinnedSymbols].map((symbol, index) => [symbol, index]));
    
    // Apply filter first
    let filteredData = globalFilter
      ? data.filter(item => 
          item.symbol.toLowerCase().includes(globalFilter.toLowerCase())
        )
      : data;

    // Apply hideTrash filter if enabled
    if (hideTrash) {
      filteredData = filteredData.filter(item => {
        // Check if any rate or spread is null/undefined/NaN
        const rates = [
          item.rates.hyperliquid,
          item.rates.binance,
          item.rates.bybit
        ];
        const spreads = [
          item.rates.spreadData?.average,
          item.rates.binanceSpreadData?.average,
          item.rates.bybitSpreadData?.average
        ];
        
        // Return true only if all values are valid numbers
        return rates.every(rate => rate !== null && rate !== undefined && !isNaN(rate)) &&
               spreads.every(spread => spread !== null && spread !== undefined && !isNaN(spread));
      });
    }
    
    // Then separate pinned and unpinned items
    const pinnedItems = filteredData
      .filter(item => pinnedSymbols.has(item.symbol))
      // Sort pinned items by their original order
      .sort((a, b) => {
        const orderA = pinnedOrder.get(a.symbol) ?? 0;
        const orderB = pinnedOrder.get(b.symbol) ?? 0;
        return orderA - orderB;
      });
      
    const unpinnedItems = filteredData.filter(item => !pinnedSymbols.has(item.symbol));
    
    // Sort only unpinned items if sorting is active
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      
      unpinnedItems.sort((a, b) => {
        let aVal, bVal;
        
        // Handle different column types
        switch (id) {
          case 'symbol':
            aVal = a.symbol;
            bVal = b.symbol;
            break;
          
          case 'hyperliquidFR':
            aVal = typeof a.rates.hyperliquid === 'number' ? a.rates.hyperliquid : null;
            bVal = typeof b.rates.hyperliquid === 'number' ? b.rates.hyperliquid : null;
            break;
            
          case 'binanceFR':
            aVal = typeof a.rates.binance === 'number' ? a.rates.binance : null;
            bVal = typeof b.rates.binance === 'number' ? b.rates.binance : null;
            break;
            
          case 'bybitFR':
            aVal = typeof a.rates.bybit === 'number' ? a.rates.bybit : null;
            bVal = typeof b.rates.bybit === 'number' ? b.rates.bybit : null;
            break;
            
          case 'spread':
            aVal = a.rates.spreadData?.average ?? null;
            bVal = b.rates.spreadData?.average ?? null;
            break;
            
          case 'binanceSpread':
            aVal = a.rates.binanceSpreadData?.average ?? null;
            bVal = b.rates.binanceSpreadData?.average ?? null;
            break;
            
          case 'bybitSpread':
            aVal = a.rates.bybitSpreadData?.average ?? null;
            bVal = b.rates.bybitSpreadData?.average ?? null;
            break;
            
          case 'hyperOI':
            const aOI = a.rates.openInterest;
            const aPrice = a.rates.oraclePx;
            const bOI = b.rates.openInterest;
            const bPrice = b.rates.oraclePx;
            
            aVal = (aOI !== null && aOI !== undefined && aPrice !== null && aPrice !== undefined) 
              ? aOI * aPrice 
              : null;
            bVal = (bOI !== null && bOI !== undefined && bPrice !== null && bPrice !== undefined) 
              ? bOI * bPrice 
              : null;
            break;
            
          default:
            if (id === 'symbol') {
              aVal = a.symbol;
              bVal = b.symbol;
            } else {
              aVal = a.rates[id as keyof typeof a.rates];
              bVal = b.rates[id as keyof typeof a.rates];
            }
        }
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal === bVal) return 0;
        
        // For funding rates and spreads, compare as numbers
        if (id.includes('FR') || id.includes('Spread') || id.includes('OI')) {
          return (Number(aVal) - Number(bVal)) * (desc ? -1 : 1);
        }
        
        // For other values, use standard comparison
        return (aVal < bVal ? -1 : 1) * (desc ? -1 : 1);
      });
    }
    
    // Combine pinned and sorted unpinned items
    return [...pinnedItems, ...unpinnedItems];
  }, [data, sorting, pinnedSymbols, globalFilter, hideTrash]);

  const columns = useMemo<ColumnDef<CombinedFundingData>[]>(() => [
    {
      id: 'pin',
      enableSorting: false,
      cell: ({ row }) => {
        const symbol = row.original.symbol;
        const isPinned = pinnedSymbols.has(symbol);
        return (
          <Button
            variant="ghost"
            onClick={() => handlePinToggle(symbol)}
            className="h-8 w-8 p-0"
          >
            <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
          </Button>
        );
      },
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Symbol
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: 'hyperOI',
      accessorFn: (row) => {
        const oi = row.rates.openInterest;
        const price = row.rates.oraclePx;
        if (oi === null || oi === undefined || price === null || price === undefined) return null;
        return oi * price;
      },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Hyper OI
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const oi = row.original.rates.openInterest;
        const price = row.original.rates.oraclePx;
        if (oi === null || oi === undefined || price === null || price === undefined) return 'N/A';
        const value = oi * price;
        return `$${Math.round(value).toLocaleString()}`;
      },
    },
    {
      id: 'hyperliquidFR',
      accessorFn: (row) => row.rates.hyperliquid,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Hyper FR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatRate(row.original.rates.hyperliquid),
    },
    {
      id: 'binanceFR',
      accessorFn: (row) => row.rates.binance,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Binance FR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatRate(row.original.rates.binance),
    },
    {
      id: 'bybitFR',
      accessorFn: (row) => row.rates.bybit,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Bybit FR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatRate(row.original.rates.bybit),
    },
    {
      id: 'spread',
      accessorFn: (row) => row.rates.spreadData?.average ?? null,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Hyper
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatSpread(row.original.rates.spreadData?.average),
    },
    {
      id: 'binanceSpread',
      accessorFn: (row) => row.rates.binanceSpreadData?.average ?? null,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Binance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatSpread(row.original.rates.binanceSpreadData?.average),
    },
    {
      id: 'bybitSpread',
      accessorFn: (row) => row.rates.bybitSpreadData?.average ?? null,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 font-medium"
          >
            Bybit
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatSpread(row.original.rates.bybitSpreadData?.average),
    },
  ], [pinnedSymbols]);

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageSize,
        pageIndex,
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (!value) return false;
      return value.toString().toLowerCase().includes(filterValue.toLowerCase());
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false, // Отключаем встроенную сортировку полностью
    manualSorting: true,
    sortDescFirst: true,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater(table.getState().pagination);
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
  });

  const handleExchangeSelect = (symbol: string, exchange: string) => {
    const current = selectedExchanges[symbol] || [];
    const updated = current.includes(exchange)
      ? current.filter(e => e !== exchange)
      : [...current, exchange].slice(-2);
    
    setSelectedExchanges({
      ...selectedExchanges,
      [symbol]: updated
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Filter symbols..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hideTrash"
              checked={hideTrash}
              onCheckedChange={(checked) => setHideTrash(checked as boolean)}
            />
            <label
              htmlFor="hideTrash"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hide trash
            </label>
          </div>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {(() => {
                    const symbol = row.getValue('symbol');
                    if (typeof symbol !== 'string') return null;
                    return selectedExchanges[symbol]?.length === 2 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center bg-muted/50 p-2 sm:p-4">
                          <Button
                            onClick={() => onOrderPlacement(
                              symbol,
                              selectedExchanges[symbol]
                            )}
                            variant="outline"
                            className="my-1 sm:my-2 text-xs sm:text-sm"
                          >
                            Order Placement
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })()}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end py-2">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} coin{table.getFilteredRowModel().rows.length === 1 ? '' : 's'} total
        </p>
      </div>
    </div>
  );
}
