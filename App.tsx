import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Sidebar } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { QueryEditor } from './components/QueryEditor';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { sqliteService } from './services/sqliteService';
import { TableInfo, QueryResult, ColumnInfo, ViewMode } from './types';
import { Database } from 'lucide-react';

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
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-0">
        {renderMainContent()}
      </main>
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
