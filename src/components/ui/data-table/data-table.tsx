import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from './data-table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  initialPageSize?: number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  initialPageSize = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado",
  className,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const {
    currentPage,
    totalPages: pageCount,
    paginatedData,
    setPage,
  } = usePagination({
    data,
    itemsPerPage: pageSize,
    initialPage: 1,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, itemIndex) => (
                <TableRow
                  key={itemIndex}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell key={columnIndex} className={column.className}>
                      {column.cell
                        ? column.cell(item)
                        : item[column.accessorKey] !== undefined
                          ? String(item[column.accessorKey])
                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        rowsCount={data.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
        }}
      />
    </div>
  );
}