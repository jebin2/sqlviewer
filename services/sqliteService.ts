import initSqlJs from 'sql.js';
import { SQL_WASM_URL } from '../constants';
import { TableInfo, QueryResult, ColumnInfo, ForeignKey } from '../types';

// Define minimal types locally to avoid import issues if the ESM wrapper doesn't export them
interface SqlJsDatabase {
  exec(sql: string): { columns: string[]; values: any[][] }[];
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
}

class SqliteService {
  private db: SqlJsDatabase | null = null;
  private SQL: SqlJsStatic | null = null;

  async init() {
    if (this.SQL) return;

    try {
      const response = await fetch(SQL_WASM_URL);
      if (!response.ok) {
        throw new Error(`Failed to download SQL WASM: ${response.status} ${response.statusText}`);
      }
      const wasmBinary = await response.arrayBuffer();

      // We use 'as any' here because the imported initSqlJs might vary in type definition 
      // depending on how it's consumed (default vs named).
      // The browser build of sql.js typically exports the init function as default.
      this.SQL = await (initSqlJs as any)({
        wasmBinary,
      });
    } catch (error) {
      console.error("Failed to initialize sql.js", error);
      throw new Error("Failed to load SQLite engine. Please check your internet connection.");
    }
  }

  loadDb(buffer: ArrayBuffer) {
    if (!this.SQL) throw new Error("SQL engine not initialized");
    // Close existing DB if any
    if (this.db) {
      this.db.close();
    }
    this.db = new this.SQL.Database(new Uint8Array(buffer));
  }

  getTables(): TableInfo[] {
    if (!this.db) return [];

    // Get tables
    const result = this.db.exec(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `);

    if (result.length === 0) return [];

    const tables = result[0].values.map((row) => {
      const name = row[0] as string;
      const sql = row[1] as string;

      // Get exact row count
      let count = 0;
      try {
        const countRes = this.db!.exec(`SELECT COUNT(*) FROM "${name}"`);
        if (countRes.length > 0) {
          count = countRes[0].values[0][0] as number;
        }
      } catch (e) {
        console.warn(`Could not count rows for ${name}`, e);
      }

      // Get Columns Metadata
      let columns: ColumnInfo[] = [];
      try {
        const colRes = this.db!.exec(`PRAGMA table_info("${name}")`);
        if (colRes.length > 0) {
          // cid, name, type, notnull, dflt_value, pk
          columns = colRes[0].values.map(c => ({
            name: c[1] as string,
            type: c[2] as string,
            primaryKey: (c[5] as number) > 0
          }));
        }
      } catch (e) {
        console.warn(`Could not fetch columns for ${name}`, e);
      }

      // Get Foreign Keys
      let foreignKeys: ForeignKey[] = [];
      try {
        const fkRes = this.db!.exec(`PRAGMA foreign_key_list("${name}")`);
        if (fkRes.length > 0) {
          // id, seq, table, from, to, on_update, on_delete, match
          foreignKeys = fkRes[0].values.map(fk => ({
            toTable: fk[2] as string,
            from: fk[3] as string,
            toColumn: fk[4] as string
          }));
        }
      } catch (e) {
        console.warn(`Could not fetch foreign keys for ${name}`, e);
      }

      return {
        name,
        schema: sql,
        rowCount: count,
        columns,
        foreignKeys
      };
    });

    return tables;
  }

  getSchemaString(): string {
    if (!this.db) return '';
    const tables = this.getTables();
    return tables.map(t => t.schema).join(';\n');
  }

  executeQuery(sql: string): QueryResult {
    if (!this.db) throw new Error("Database not loaded");
    const start = performance.now();
    try {
      const res = this.db.exec(sql);
      const end = performance.now();

      if (res.length === 0) {
        return { columns: [], values: [], executionTime: end - start };
      }

      return {
        columns: res[0].columns,
        values: res[0].values,
        executionTime: end - start
      };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  // Safe getter for column info using PRAGMA
  getTableColumns(tableName: string): ColumnInfo[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`PRAGMA table_info("${tableName}")`);
      if (res.length === 0) return [];

      // cid, name, type, notnull, dflt_value, pk
      return res[0].values.map(row => ({
        name: row[1] as string,
        type: row[2] as string,
        primaryKey: (row[5] as number) > 0
      }));
    } catch (e) {
      return [];
    }
  }

  // Export database as binary SQLite file
  exportDb(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }
}

export const sqliteService = new SqliteService();