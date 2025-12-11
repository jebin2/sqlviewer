import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Sidebar } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { QueryEditor } from './components/QueryEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { sqliteService } from './services/sqliteService';
import { TableInfo, QueryResult, ColumnInfo, ViewMode } from './types';
import { Database, X, Copy, Check, FileText, Trash2 } from 'lucide-react';

// Edit History Modal Component
const EditHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  queries: string[];
  onClear: () => void;
}> = ({ isOpen, onClose, queries, onClear }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const allQueries = queries.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(allQueries);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Edit Query Log</h3>
              <p className="text-sm text-slate-500">{queries.length} modification{queries.length !== 1 ? 's' : ''} made</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {queries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No edits made yet</p>
              <p className="text-sm mt-1">Click on any cell to edit its value</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
              {queries.map((query, idx) => (
                <div key={idx} className="py-1 border-b border-slate-700 last:border-b-0">
                  <span className="text-slate-500 mr-3">#{idx + 1}</span>
                  {query}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-between">
          <button
            onClick={onClear}
            disabled={queries.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              disabled={queries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All Queries
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [currentMode, setCurrentMode] = useState<ViewMode>('BROWSE');

  // Search, Sort and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Query Editor State
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Edit History State
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    // Initialize WASM
    sqliteService.init().catch(console.error);
  }, []);

  // Fetch data function - defined with useCallback to be stable
  const fetchTableData = useCallback(async (
    tableName: string,
    limit: number,
    offset: number,
    term: string,
    sortCol: string | null,
    sortDir: 'ASC' | 'DESC'
  ) => {
    if (!tableName) return;
    setDataLoading(true);
    try {
      // Get Columns Metadata first
      const cols = sqliteService.getTableColumns(tableName);
      setTableColumns(cols);

      // Build Query
      let query = `SELECT * FROM "${tableName}"`;
      let countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;

      // Apply Search Filter
      if (term.trim()) {
        // Comprehensive SQL sanitization for LIKE patterns
        // Escape special characters: single quotes, backslashes, and LIKE wildcards
        const safeTerm = term
          .replace(/\\/g, '\\\\')     // Escape backslashes first
          .replace(/'/g, "''")        // Escape single quotes
          .replace(/%/g, '\\%')       // Escape LIKE wildcard %
          .replace(/_/g, '\\_');      // Escape LIKE wildcard _

        // Construct WHERE clause with ESCAPE clause for LIKE
        if (cols.length > 0) {
          const whereClause = " WHERE " + cols.map(col => `"${col.name}" LIKE '%${safeTerm}%' ESCAPE '\\'`).join(" OR ");
          query += whereClause;
          countQuery += whereClause;
        }
      }

      // Apply Sort
      if (sortCol) {
        query += ` ORDER BY "${sortCol}" ${sortDir}`;
      }

      // 1. Get Count
      try {
        const countRes = sqliteService.executeQuery(countQuery);
        if (countRes.values.length > 0) {
          setRowCount(Number(countRes.values[0][0]));
        } else {
          setRowCount(0);
        }
      } catch (e) {
        console.warn("Count query failed", e);
        setRowCount(0);
      }

      // 2. Get Data with Pagination
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      const result = sqliteService.executeQuery(query);
      setTableData(result);

    } catch (e) {
      console.error("Failed to fetch table data", e);
      setTableData(null);
    } finally {
      setDataLoading(false);
    }
  }, []); // Empty deps as sqliteService is a singleton and stable

  const handleSelectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    setCurrentMode('BROWSE');
    setSearchTerm(''); // Reset search term UI
    setSortColumn(null); // Reset sort
    setSortDirection('ASC');
    // Reset to first page (offset 0)
    fetchTableData(tableName, 50, 0, '', null, 'ASC');
  }, [fetchTableData]);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      await sqliteService.loadDb(buffer);
      const tablesList = sqliteService.getTables();

      setTables(tablesList);
      setFileName(file.name);
      setDbLoaded(true);

      // Auto select first table if available
      if (tablesList.length > 0) {
        handleSelectTable(tablesList[0].name);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load database file. Please ensure it is a valid SQLite file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (limit: number, offset: number) => {
    if (selectedTable) {
      fetchTableData(selectedTable, limit, offset, searchTerm, sortColumn, sortDirection);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (selectedTable) {
      // We keep current sort when searching
      fetchTableData(selectedTable, 50, 0, term, sortColumn, sortDirection);
    }
  };

  const handleSort = (column: string) => {
    let newDirection: 'ASC' | 'DESC' = 'ASC';
    if (sortColumn === column && sortDirection === 'ASC') {
      newDirection = 'DESC';
    }
    setSortColumn(column);
    setSortDirection(newDirection);

    if (selectedTable) {
      // Reset to first page when sorting changes
      fetchTableData(selectedTable, 50, 0, searchTerm, column, newDirection);
    }
  };

  const handleExecuteQuery = (sql: string) => {
    setQueryError(null);
    try {
      const result = sqliteService.executeQuery(sql);
      setQueryResult(result);
    } catch (e: any) {
      setQueryError(e.message);
      setQueryResult(null);
    }
  };

  const handleExportDb = () => {
    const data = sqliteService.exportDb();
    if (!data) {
      alert('No database loaded to export.');
      return;
    }

    // Create download link - create a copy for Blob compatibility
    const blob = new Blob([new Uint8Array(data)], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use original filename or default
    const exportName = fileName.endsWith('.sqlite') || fileName.endsWith('.db')
      ? fileName
      : fileName.replace(/\.[^.]+$/, '') + '.sqlite';
    a.download = exportName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle cell edit - generate and execute UPDATE query
  const handleCellEdit = useCallback((tableName: string, column: string, newValue: any, rowData: any[], dataColumns: string[]) => {
    // Find primary key column(s) to build WHERE clause
    const tableInfo = tables.find(t => t.name === tableName);
    const pkColumns = tableInfo?.columns.filter(c => c.primaryKey) || [];

    // Build the SET clause
    const escapedValue = newValue === null
      ? 'NULL'
      : `'${String(newValue).replace(/'/g, "''")}'`;

    // Build WHERE clause using primary key or all columns as fallback
    let whereClause: string;
    if (pkColumns.length > 0) {
      whereClause = pkColumns.map(pk => {
        const colIndex = dataColumns.indexOf(pk.name);
        const oldVal = rowData[colIndex];
        return oldVal === null
          ? `"${pk.name}" IS NULL`
          : `"${pk.name}" = '${String(oldVal).replace(/'/g, "''")}'`;
      }).join(' AND ');
    } else {
      // Fallback: use all columns (risky if duplicates exist)
      whereClause = dataColumns.map((col, idx) => {
        const val = rowData[idx];
        return val === null
          ? `"${col}" IS NULL`
          : `"${col}" = '${String(val).replace(/'/g, "''")}'`;
      }).join(' AND ');
    }

    const updateQuery = `UPDATE "${tableName}" SET "${column}" = ${escapedValue} WHERE ${whereClause};`;

    try {
      sqliteService.executeQuery(updateQuery);
      // Add to edit history
      setEditHistory(prev => [...prev, updateQuery]);
      // Refresh current table data
      if (selectedTable === tableName) {
        fetchTableData(tableName, 50, 0, searchTerm, sortColumn, sortDirection);
      }
    } catch (e: any) {
      alert(`Edit failed: ${e.message}`);
    }
  }, [tables, selectedTable, searchTerm, sortColumn, sortDirection, fetchTableData]);

  const renderMainContent = () => {
    switch (currentMode) {
      case 'QUERY':
        return (
          <QueryEditor
            onExecute={handleExecuteQuery}
            schema={sqliteService.getSchemaString()}
            lastResult={queryResult}
            error={queryError}
          />
        );
      case 'SCHEMA':
        return (
          <SchemaVisualizer tables={tables} />
        );
      case 'BROWSE':
      default:
        return selectedTable ? (
          <DataTable
            tableName={selectedTable}
            data={tableData}
            columns={tableColumns}
            totalRows={rowCount}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            isLoading={dataLoading}
            onCellEdit={handleCellEdit}
          />
        ) : (
          <EmptyState />
        );
    }
  };

  if (!dbLoaded) {
    return <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={handleSelectTable}
        onModeChange={setCurrentMode}
        currentMode={currentMode}
        dbName={fileName}
        onExport={handleExportDb}
        editCount={editHistory.length}
        onShowEditHistory={() => setShowEditHistory(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-0">
        {renderMainContent()}
      </main>

      <EditHistoryModal
        isOpen={showEditHistory}
        onClose={() => setShowEditHistory(false)}
        queries={editHistory}
        onClear={() => setEditHistory([])}
      />
    </div>
  );
}

const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
      <Database className="w-12 h-12 text-slate-300" />
    </div>
    <h2 className="text-2xl font-semibold text-slate-700 mb-3">No Table Selected</h2>
    <p className="max-w-lg text-lg">Select a table from the sidebar to browse its data, check the schema diagram, or switch to SQL Editor mode.</p>
  </div>
);

export default App;
