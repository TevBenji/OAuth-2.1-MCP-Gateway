'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === bVal) return 0;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (data.length === 0) {
    return (
      <div className='text-center py-8 text-wise-gray-500'>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead>
          <tr className='border-b border-wise-gray-200'>
            {columns.map((column) => (
              <th
                key={column.key as string}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-wise-gray-500 ${
                  column.sortable ? 'cursor-pointer hover:bg-wise-gray-50' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className='flex items-center space-x-1'>
                  <span>{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <span>
                      {sortDirection === 'asc' ? (
                        <ChevronUp className='w-4 h-4' />
                      ) : (
                        <ChevronDown className='w-4 h-4' />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-wise-gray-200'>
          {sortedData.map((item, index) => (
            <tr key={index} className='transition-colors hover:bg-wise-gray-50'>
              {columns.map((column) => (
                <td key={column.key as string} className='px-4 py-3 text-sm text-wise-gray-900'>
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
