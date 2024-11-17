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
import { Progress } from "@/components/ui/progress";
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
import { ChevronDown, ChevronUp, ChevronsUpDown, Pin } from 'lucide-react';

interface FundingTableProps {
  data: CombinedFundingData[];
  onOrderPlacement: (symbol: string, exchanges: string[]) => void;
  progress: number;
}

export function FundingTable({ data, onOrderPlacement, progress }: FundingTableProps) {
  const [selectedExchanges, setSelectedExchanges] = useState<{[key: string]: string[]}>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [pinnedSymbols, setPinnedSymbols] = useLocalStorage<Set<string>>("pinnedSymbols", new Set());

  const formatRate = (rate: number | undefined) => {
    if (rate === undefined) return 'N/A';
    return `${(rate * 100).toFixed(4)}%`;
  };

  const togglePinned = (symbol: string) => {
    const newPinnedSymbols = new Set(pinnedSymbols);
    if (newPinnedSymbols.has(symbol)) {
      newPinnedSymbols.delete(symbol);
    } else {
      newPinnedSymbols.add(symbol);
    }
    setPinnedSymbols(newPinnedSymbols);
  };

  const sortedData = useMemo(() => {
    const pinnedSet = new Set(Array.from(pinnedSymbols));
    
    // Сначала применяем базовую сортировку по столбцам
    let sorted = [...data];
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      sorted.sort((a, b) => {
        const aValue = a[id as keyof CombinedFundingData];
        const bValue = b[id as keyof CombinedFundingData];
        
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return desc ? -1 : 1;
        if (bValue === undefined) return desc ? 1 : -1;
        
        return desc 
          ? (aValue < bValue ? 1 : aValue > bValue ? -1 : 0)
          : (aValue < bValue ? -1 : aValue > bValue ? 1 : 0);
      });
    }

    // Затем разделяем на закрепленные и незакрепленные
    const pinnedItems = sorted.filter(item => pinnedSet.has(item.symbol));
    const unpinnedItems = sorted.filter(item => !pinnedSet.has(item.symbol));

    // Возвращаем объединенный массив
    return [...pinnedItems, ...unpinnedItems];
  }, [data, pinnedSymbols, sorting]);

  const columns = useMemo<ColumnDef<CombinedFundingData>[]>(() => [
    {
      id: 'pin',
      size: 40,
      header: () => null,
      cell: ({ row }) => {
        const pinnedSet = new Set(Array.from(pinnedSymbols));
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => togglePinned(row.getValue('symbol'))}
          >
            <Pin 
              className={`h-4 w-4 ${pinnedSet.has(row.getValue('symbol')) ? 'fill-current' : ''}`}
            />
          </Button>
        );
      },
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2 cursor-pointer" 
               onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            <span>Coin</span>
            {{
              asc: <ChevronUp className="w-4 h-4" />,
              desc: <ChevronDown className="w-4 h-4" />,
              false: <ChevronsUpDown className="w-4 h-4" />,
            }[column.getIsSorted() as string ?? 'false']}
          </div>
        );
      },
    },
    {
      accessorKey: 'hyperliquid',
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2 cursor-pointer whitespace-nowrap"
               onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            <span className="hidden sm:inline">Hyperliquid</span>
            <span className="sm:hidden">HL</span>
            {{
              asc: <ChevronUp className="w-4 h-4" />,
              desc: <ChevronDown className="w-4 h-4" />,
              false: <ChevronsUpDown className="w-4 h-4" />,
            }[column.getIsSorted() as string ?? 'false']}
          </div>
        );
      },
      cell: ({ row }) => formatRate(row.getValue('hyperliquid')),
    },
    {
      accessorKey: 'binance',
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2 cursor-pointer whitespace-nowrap"
               onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            <span className="hidden sm:inline">Binance</span>
            <span className="sm:hidden">BN</span>
            {{
              asc: <ChevronUp className="w-4 h-4" />,
              desc: <ChevronDown className="w-4 h-4" />,
              false: <ChevronsUpDown className="w-4 h-4" />,
            }[column.getIsSorted() as string ?? 'false']}
          </div>
        );
      },
      cell: ({ row }) => formatRate(row.getValue('binance')),
    },
    {
      accessorKey: 'bybit',
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2 cursor-pointer whitespace-nowrap"
               onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            <span className="hidden sm:inline">Bybit</span>
            <span className="sm:hidden">BB</span>
            {{
              asc: <ChevronUp className="w-4 h-4" />,
              desc: <ChevronDown className="w-4 h-4" />,
              false: <ChevronsUpDown className="w-4 h-4" />,
            }[column.getIsSorted() as string ?? 'false']}
          </div>
        );
      },
      cell: ({ row }) => formatRate(row.getValue('bybit')),
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
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getCoreRowModel(), // Заменяем на CoreRowModel, так как мы делаем сортировку вручную
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
      <div className="space-y-2 px-2 sm:px-0">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Funding rates update every 30 seconds
          </p>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-0">
        <Input
          placeholder="Filter coins..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm text-xs sm:text-sm h-8 sm:h-10"
        />
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[60px] sm:w-[70px] h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue>{pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-xs sm:text-sm">10</SelectItem>
              <SelectItem value="25" className="text-xs sm:text-sm">25</SelectItem>
              <SelectItem value="50" className="text-xs sm:text-sm">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {table.getFlatHeaders().map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap text-xs sm:text-sm p-2 sm:p-4">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${
                        cell.column.id !== 'symbol' && cell.column.id !== 'pin' 
                          ? "cursor-pointer hover:bg-muted whitespace-nowrap" 
                          : "whitespace-nowrap"
                      } text-xs sm:text-sm p-2 sm:p-4`}
                      onClick={() => {
                        if (cell.column.id !== 'symbol' && cell.column.id !== 'pin') {
                          handleExchangeSelect(row.getValue('symbol'), cell.column.id);
                        }
                      }}
                    >
                      <div className={
                        cell.column.id !== 'symbol' && cell.column.id !== 'pin' && 
                        selectedExchanges[row.getValue('symbol')]?.includes(cell.column.id)
                          ? 'font-bold'
                          : ''
                      }>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                {selectedExchanges[row.getValue('symbol')]?.length === 2 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center bg-muted/50 p-2 sm:p-4">
                      <Button
                        onClick={() => onOrderPlacement(
                          row.getValue('symbol'),
                          selectedExchanges[row.getValue('symbol')]
                        )}
                        variant="outline"
                        className="my-1 sm:my-2 text-xs sm:text-sm"
                      >
                        Order Placement
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-0">
        <div className="flex-1 text-xs sm:text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} coin{table.getFilteredRowModel().rows.length === 1 ? '' : 's'} total
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
          <div className="flex w-[80px] sm:w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => table.previousPage()}
                    className={`${!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"} text-xs sm:text-sm h-8 sm:h-10`}
                  />
                </PaginationItem>
                {[...Array(table.getPageCount())].map((_, idx) => {
                  if (idx === pageIndex) {
                    return (
                      <PaginationItem key={idx} className="hidden sm:inline-block">
                        <PaginationLink isActive className="text-xs sm:text-sm h-8 sm:h-10">{idx + 1}</PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (
                    idx === 0 ||
                    idx === table.getPageCount() - 1 ||
                    (idx >= pageIndex - 1 && idx <= pageIndex + 1)
                  ) {
                    return (
                      <PaginationItem key={idx} className="hidden sm:inline-block">
                        <PaginationLink onClick={() => setPageIndex(idx)} className="text-xs sm:text-sm h-8 sm:h-10">
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (idx === pageIndex - 2 || idx === pageIndex + 2) {
                    return <PaginationEllipsis key={idx} className="hidden sm:inline-block" />;
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => table.nextPage()}
                    className={`${!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"} text-xs sm:text-sm h-8 sm:h-10`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
