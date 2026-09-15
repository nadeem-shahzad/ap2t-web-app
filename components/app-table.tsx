'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';
import { useSidebar } from './ui/sidebar';
import { Spinner } from './ui/spinner';

type PageTableProps<T extends Record<string, any>> = {
  columns: ColumnDef<T>[];
  data: T[];
  pageSizeOptions?: number[];
  disableInput?: boolean;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  headerClassName?: string;
  scrollAreaWidth?: string;
};

const PageTable = <T extends Record<string, any>>({
  columns,
  data,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onRowClick,
  loading = false,
  headerClassName = '',
  scrollAreaWidth = '',
}: PageTableProps<T>) => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [open, setOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const paginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  };
  const { open: sidebarOpen } = useSidebar();

  const pageCount = Math.ceil(data.length / pageSize);

  const handlePaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    const pagination =
      typeof updaterOrValue === 'function' ? updaterOrValue(paginationState) : updaterOrValue;

    setCurrentPage(pagination.pageIndex + 1);
    setPageSize(pagination.pageSize);
  };

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    pageCount: pageCount,
    state: {
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    },
    onPaginationChange: handlePaginationChange,
    defaultColumn: {
      size: 200,
    },
  });

  const startIndex = paginationState.pageIndex * paginationState.pageSize + 1;
  const endIndex = Math.min(
    (paginationState.pageIndex + 1) * paginationState.pageSize,
    data.length
  );

  const isMobile = useIsMobile();

  useEffect(() => {
    if (sidebarOpen) {
      setOpen(sidebarOpen);
      return;
    }
    const timer = setTimeout(() => {
      setOpen(sidebarOpen);
    }, 200);

    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div
        className={`relative flex flex-1 flex-col ${open ? 'w-[calc(100dvw-304px)]' : 'w-[calc(100dvw-96px)]'} ${isMobile && 'w-[calc(100vw-44px)]'} ${scrollAreaWidth}`}
      >
        <div className={`flex flex-col rounded-md border md:overflow-auto ${headerClassName}`}>
          <ScrollArea className="overflow-x-auto flex flex-1 h-[500px]">
            <Table className="relative w-full">
              <TableHeader className="">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-background hover:bg-background">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        style={{ width: header.getSize() }}
                        key={header.id}
                        className="p-0 py-2"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="bg-white dark:bg-[#252525]">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: any) => (
                    <TableRow
                      onClick={(e) => onRowClick?.(row.original, e)}
                      className="even:bg-gray-100 dark:even:bg-[#2A2A2A] dark:text-white text-black hover:bg-inherit"
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell: any) => (
                        <TableCell className="text-[12px] p-3" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            stopRowClick: (e: any) => e.stopPropagation(),
                          })}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {loading ? (
                        <div className="flex flex-1 justify-center">
                          <Spinner />
                        </div>
                      ) : (
                        'No results.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 sm:flex-row px-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex-1 text-sm text-muted-foreground">
                {data.length > 0 ? (
                  <>
                    Showing {startIndex} to {endIndex} of {data.length} entries
                  </>
                ) : (
                  'No entries found'
                )}
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${paginationState.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={paginationState.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {pageSizeOptions.map((pageSize: number) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
              <div className="flex sm:w-[250px] items-center justify-center text-sm font-medium">
                {data.length > 0 ? (
                  <>
                    Page {paginationState.pageIndex + 1} of {pageCount}
                  </>
                ) : (
                  'No pages'
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  aria-label="Go to first page"
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Go to previous page"
                  variant="outline"
                  className="p-0 w-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Go to next page"
                  variant="outline"
                  className="p-0 w-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Go to last page"
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PageTable;
