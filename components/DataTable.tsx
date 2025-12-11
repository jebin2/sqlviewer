import React, { useEffect, useState, useRef } from 'react';
import { QueryResult, ColumnInfo } from '../types';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Search, X, Copy, Check, Maximize2, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

interface DataTableProps {
  data: QueryResult | null;
  columns: ColumnInfo[];
  tableName: string;
  totalRows: number;
  onPageChange: (limit: number, offset: number) => void;
  onSearch: (term: string) => void;
  onSort: (column: string) => void;
  sortColumn: string | null;
  sortDirection: 'ASC' | 'DESC';
  isLoading: boolean;
}

interface CellDetail {
  value: any;
  column: string;
}

const CellModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  data: CellDetail | null
}> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const displayValue = data.value === null ? 'NULL' : String(data.value);
  const isNull = data.value === null;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-800">{data.column}</h3>
            <span className="px-2.5 py-1 rounded text-sm font-medium bg-slate-100 text-slate-500 border border-slate-200">
              {isNull ? 'NULL' : typeof data.value}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className={`
            w-full h-full rounded-lg border border-slate-200 bg-white p-6 font-mono text-base leading-relaxed overflow-x-auto
            ${isNull ? 'text-slate-400 italic' : 'text-slate-700'}
          `}>
            <pre className="whitespace-pre-wrap break-all font-mono">
              {displayValue}
            </pre>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-white rounded-b-xl flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} disabled={isNull}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Content
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  tableName,
  totalRows,
  onPageChange,
  onSearch,
  onSort,
  sortColumn,
  sortDirection,
  isLoading
}) => {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);

  const onSearchRef = useRef(onSearch);
  const isFirstRender = useRef(true);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const lastInitTableRef = useRef<string>('');

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Reset search and page when table changes
  useEffect(() => {
    setPage(1);
    setSearchTerm('');
  }, [tableName]);

  // Sync visible columns only when table changes (and we have columns)
  useEffect(() => {
    if (columns.length > 0 && tableName !== lastInitTableRef.current) {
      setVisibleColumns(new Set(columns.map(c => c.name)));
      lastInitTableRef.current = tableName;
    }
  }, [tableName, columns]);

  // Reset page when sorting changes
  useEffect(() => {
    setPage(1);
  }, [sortColumn, sortDirection]);

  // Handle click outside for column menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      onSearchRef.current(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const totalPages = Math.ceil(totalRows / limit);

  const handleNext = () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      onPageChange(limit, (newPage - 1) * limit);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      onPageChange(limit, (newPage - 1) * limit);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleCopyRow = (e: React.MouseEvent, row: any[], index: number) => {
    e.stopPropagation();
    if (!data) return;

    const rowData = data.columns.reduce((acc: any, col, i) => {
      acc[col] = row[i];
      return acc;
    }, {});

    navigator.clipboard.writeText(JSON.stringify(rowData, null, 2));
    setCopiedRowIndex(index);
    setTimeout(() => setCopiedRowIndex(null), 2000);
  };

  const toggleColumn = (name: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setVisibleColumns(newSet);
  };

  const selectAllColumns = () => {
    setVisibleColumns(new Set(columns.map(c => c.name)));
  };

  const deselectAllColumns = () => {
    setVisibleColumns(new Set());
  };

  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[column] || 180;
    setResizing({ column, startX, startWidth });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center h-full bg-white">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-lg">Loading data...</p>
          </div>
        </div>
      );
    }

    if (!data || data.values.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white h-full text-slate-500">
          <div className="p-6 bg-slate-50 rounded-full mb-5">
            <Filter className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg">No records found{searchTerm ? ` matching "${searchTerm}"` : ` in ${tableName}`}</p>
        </div>
      );
    }

    // Filter which indices in the data arrays correspond to visible columns
    const visibleColIndices = data.columns.map((name, idx) => ({ name, idx })).filter(c => visibleColumns.has(c.name));

    return (
      <div className="flex-1 overflow-auto relative">
        <table className="w-full border-collapse text-left text-base">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-16 px-6 py-4 font-medium text-slate-500 border-b border-slate-200 bg-slate-50">#</th>
              {visibleColIndices.map(({ name: col, idx }) => {
                const colInfo = columns.find(c => c.name === col);
                const isSorted = sortColumn === col;
                const width = columnWidths[col];

                return (
                  <th
                    key={idx}
                    style={width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
                    className={`
                            resizable-header px-6 py-4 font-semibold border-b border-slate-200 whitespace-nowrap cursor-pointer transition-colors group select-none
                            ${!width ? 'min-w-[180px]' : ''}
                            ${isSorted ? 'bg-blue-50/50 text-blue-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}
                        `}
                  >
                    <div className="flex items-center gap-2" onClick={() => onSort(col)}>
                      <span className="truncate">{col}</span>
                      {colInfo && (
                        <span className={`text-xs font-normal px-1.5 py-0.5 rounded border flex-shrink-0 ${isSorted ? 'bg-blue-100 text-blue-600 border-blue-200' : 'text-slate-400 bg-slate-200/50 border-transparent'}`}>
                          {colInfo.type}
                        </span>
                      )}
                      <div className="ml-auto flex-shrink-0">
                        {isSorted ? (
                          sortDirection === 'ASC' ? (
                            <ArrowUp className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                    <div
                      className={`resize-handle ${resizing?.column === col ? 'resizing' : ''}`}
                      onMouseDown={(e) => handleResizeStart(e, col)}
                      title="Drag to resize"
                    />
                  </th>
                );
              })}
              <th className="w-16 px-4 py-4 border-b border-slate-200 bg-slate-50 sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.values.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-3 text-slate-400 font-mono text-sm select-none bg-slate-50/30 border-r border-slate-100 group-hover:bg-slate-100/50">
                  {(page - 1) * limit + rowIdx + 1}
                </td>
                {visibleColIndices.map(({ name: colName, idx: cellIdx }) => {
                  const cell = row[cellIdx];
                  return (
                    <td
                      key={cellIdx}
                      onClick={() => setSelectedCell({ value: cell, column: colName })}
                      className="px-6 py-3 text-slate-600 max-w-xs truncate cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors relative group/cell"
                      title="Click to view full content"
                    >
                      {cell === null ? (
                        <span className="text-sm text-slate-300 italic">NULL</span>
                      ) : typeof cell === 'boolean' ? (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cell ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {String(cell)}
                        </span>
                      ) : (
                        <span className="font-mono text-sm">{String(cell)}</span>
                      )}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-blue-400" />
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center border-l border-slate-100 bg-slate-50/30 group-hover:bg-slate-100/50 sticky right-0 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  <button
                    onClick={(e) => handleCopyRow(e, row, rowIdx)}
                    className={`p-2 rounded-md transition-all ${copiedRowIndex === rowIdx
                      ? 'bg-green-100 text-green-600'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100'
                      }`}
                    title="Copy row JSON"
                  >
                    {copiedRowIndex === rowIdx ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0 gap-6">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">{tableName}</h2>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-sm font-mono text-slate-600 border border-slate-200 whitespace-nowrap">
              {totalRows.toLocaleString()} rows
            </span>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search data..."
                className="w-full pl-10 pr-10 py-2 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative" ref={columnMenuRef}>
              <Button
                variant="secondary"
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className={`flex items-center gap-2 ${isColumnMenuOpen ? 'bg-slate-50 ring-2 ring-slate-100' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>

              {isColumnMenuOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Show Columns</span>
                    <div className="flex gap-3">
                      <button onClick={selectAllColumns} className="text-xs text-blue-600 hover:underline font-medium">All</button>
                      <button onClick={deselectAllColumns} className="text-xs text-slate-400 hover:text-slate-600 hover:underline">None</button>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[400px] p-2 space-y-1">
                    {columns.map(col => (
                      <label key={col.name} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded cursor-pointer select-none transition-colors">
                        <div className={`
                                        w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                                        ${visibleColumns.has(col.name) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}
                                    `}>
                          {visibleColumns.has(col.name) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.name)}
                          onChange={() => toggleColumn(col.name)}
                          className="hidden"
                        />
                        <span className={`text-base truncate ${visibleColumns.has(col.name) ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                          {col.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-base text-slate-500 hidden sm:inline">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="p-2.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border-r border-slate-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={handleNext}
                disabled={page === totalPages || totalPages === 0}
                className="p-2.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>

      <CellModal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        data={selectedCell}
      />
    </>
  );
};