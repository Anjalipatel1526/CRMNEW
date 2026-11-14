'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilterKey?: keyof T;
  actions?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFilterKey,
  actions,
  emptyMessage = 'No records found',
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const pageSize = 10;

  // Filter based on search query
  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (!search.trim()) return true;
      if (searchFilterKey && item[searchFilterKey]) {
        return String(item[searchFilterKey]).toLowerCase().includes(search.toLowerCase());
      }
      // Search across all string fields
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [data, search, searchFilterKey]);

  // Sort filtered records: handles numbers, currency, dates, and text strings
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null/undefined values (push to end)
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // 1. Numeric sorting (handles pure numbers)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // 2. String comparison (supports formatted numbers, currency, dates, and natural text)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        // Strip common currency symbols, commas, or spaces if numeric (e.g. "₹12,50,000", "150 km")
        const cleanA = aVal.replace(/[^0-9.-]+/g, '');
        const cleanB = bVal.replace(/[^0-9.-]+/g, '');
        if (
          cleanA &&
          cleanB &&
          !isNaN(Number(cleanA)) &&
          !isNaN(Number(cleanB)) &&
          /\d/.test(aVal) &&
          /\d/.test(bVal)
        ) {
          const numA = Number(cleanA);
          const numB = Number(cleanB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return sortDirection === 'asc' ? numA - numB : numB - numA;
          }
        }

        // Date sorting (ISO dates, YYYY-MM-DD, DD/MM/YYYY)
        if (
          (aVal.includes('-') || aVal.includes('/')) &&
          !isNaN(Date.parse(aVal)) &&
          !isNaN(Date.parse(bVal))
        ) {
          const timeA = new Date(aVal).getTime();
          const timeB = new Date(bVal).getTime();
          if (!isNaN(timeA) && !isNaN(timeB)) {
            return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
          }
        }

        // Natural case-insensitive string comparison
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
          : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
      }

      // 3. Boolean sorting
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc'
          ? (aVal === bVal ? 0 : aVal ? -1 : 1)
          : (aVal === bVal ? 0 : aVal ? 1 : -1);
      }

      return 0;
    });
  }, [filtered, sortKey, sortDirection]);

  // Handle header click to cycle: asc -> desc -> reset
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Table Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Showing <strong>{sorted.length}</strong> items
          </span>
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.accessorKey && col.sortable !== false;
                const isCurrentSort = sortKey === String(col.accessorKey);

                return (
                  <th
                    key={idx}
                    style={{
                      width: col.width,
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      if (isSortable) {
                        handleSort(String(col.accessorKey));
                      }
                    }}
                    title={isSortable ? `Click to sort by ${col.header}` : undefined}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={13} style={{ color: '#6253F8' }} />
                            ) : (
                              <ArrowDown size={13} style={{ color: '#6253F8' }} />
                            )
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
