
export interface ColumnInfo {
  name: string;
  type: string;
  primaryKey?: boolean;
}

export interface ForeignKey {
  from: string;      // Column in the current table
  toTable: string;   // Target table name
  toColumn: string;  // Target column name
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  executionTime?: number;
}

export interface DatabaseError {
  message: string;
}

export type ViewMode = 'BROWSE' | 'QUERY' | 'SCHEMA';

export interface SqlService {
  init: () => Promise<void>;
  loadDb: (buffer: ArrayBuffer) => Promise<void>;
  getTables: () => TableInfo[];
  getTableSchema: (tableName: string) => Promise<ColumnInfo[]>;
  executeQuery: (sql: string) => QueryResult;
  exportTable: (tableName: string) => any[]; // Placeholder
}
