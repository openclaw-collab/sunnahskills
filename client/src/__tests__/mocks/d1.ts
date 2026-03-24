import { vi } from "vitest";

/**
 * Mock Cloudflare D1 Database for testing.
 * Provides an in-memory implementation of D1 operations.
 */

// ============================================================================
// Types
// ============================================================================

type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
  meta?: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
};

type D1Response<T = unknown> = {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id: number;
    changes: number;
  };
};

// D1Database interface definition for type safety
interface D1DatabaseInterface {
  prepare(query: string): D1PreparedStatementInterface;
  batch<T>(statements: D1PreparedStatementInterface[]): Promise<D1Response<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface D1PreparedStatementInterface {
  bind(...values: unknown[]): D1PreparedStatementInterface;
  first<T>(): Promise<T | null>;
  run<T>(): Promise<D1Response<T>>;
  all<T>(): Promise<D1Result<T>>;
  raw<T>(): Promise<T[]>;
}

// ============================================================================
// In-Memory D1 Implementation
// ============================================================================

export class MockD1Database implements D1DatabaseInterface {
  private tables: Map<string, Record<string, unknown>[]> = new Map();
  private lastId = 0;

  /**
   * Prepare a SQL statement (returns a statement object)
   */
  prepare(query: string): MockD1PreparedStatement {
    return new MockD1PreparedStatement(this, query);
  }

  /**
   * Execute a batch of statements
   */
  async batch<T = unknown>(
    statements: MockD1PreparedStatement[]
  ): Promise<D1Response<T>[]> {
    return Promise.all(statements.map((s) => s.run<T>()));
  }

  /**
   * Execute a SQL query directly
   */
  async exec(query: string): Promise<{ count: number; duration: number }> {
    // Simplified exec - just return success
    return { count: 0, duration: 0 };
  }

  /**
   * Dump the database (for debugging)
   */
  dump(): Record<string, Record<string, unknown>[]> {
    const result: Record<string, Record<string, unknown>[]> = {};
    this.tables.forEach((rows, table) => {
      result[table] = [...rows];
    });
    return result;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.tables.clear();
    this.lastId = 0;
  }

  /**
   * Insert data into a table (helper for test setup)
   */
  insert(table: string, data: Record<string, unknown>): number {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    const rows = this.tables.get(table)!;
    const id = ++this.lastId;
    rows.push({ ...data, id });
    return id;
  }

  /**
   * Get all rows from a table (helper for assertions)
   */
  getTable(table: string): Record<string, unknown>[] {
    return this.tables.get(table) || [];
  }

  /**
   * Internal method to execute a query
   */
  _executeQuery<T>(
    query: string,
    bindings: unknown[]
  ): D1Response<T> {
    const lowerQuery = query.toLowerCase().trim();

    // Very simple query parsing for common operations
    if (lowerQuery.startsWith("select")) {
      return this._handleSelect<T>(query, bindings);
    } else if (lowerQuery.startsWith("insert")) {
      return this._handleInsert<T>(query, bindings);
    } else if (lowerQuery.startsWith("update")) {
      return this._handleUpdate<T>(query, bindings);
    } else if (lowerQuery.startsWith("delete")) {
      return this._handleDelete<T>(query, bindings);
    }

    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changes: 0,
      },
    };
  }

  private _handleSelect<T>(
    _query: string,
    _bindings: unknown[]
  ): D1Response<T> {
    // Simplified - would need proper SQL parsing for real implementation
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changes: 0,
      },
    };
  }

  private _handleInsert<T>(
    query: string,
    bindings: unknown[]
  ): D1Response<T> {
    const tableMatch = query.match(/into\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : "unknown";

    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }

    const id = ++this.lastId;
    const row: Record<string, unknown> = { id };

    // Extract column names and bind values
    const colMatch = query.match(/\(([^)]+)\)/);
    if (colMatch) {
      const columns = colMatch[1].split(",").map((c) => c.trim());
      columns.forEach((col, i) => {
        if (i < bindings.length) {
          row[col] = bindings[i];
        }
      });
    }

    this.tables.get(table)!.push(row);

    return {
      results: [{ id } as T],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 1,
        last_row_id: id,
        changes: 1,
      },
    };
  }

  private _handleUpdate<T>(
    _query: string,
    _bindings: unknown[]
  ): D1Response<T> {
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changes: 0,
      },
    };
  }

  private _handleDelete<T>(
    _query: string,
    _bindings: unknown[]
  ): D1Response<T> {
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changes: 0,
      },
    };
  }
}

// ============================================================================
// Prepared Statement Mock
// ============================================================================

export class MockD1PreparedStatement implements D1PreparedStatementInterface {
  private bindings: unknown[] = [];

  constructor(
    private db: MockD1Database,
    private query: string
  ) {}

  bind(...values: unknown[]): MockD1PreparedStatement {
    this.bindings = values;
    return this;
  }

  first<T = unknown>(): Promise<T | null> {
    const result = this.db._executeQuery<T>(this.query, this.bindings);
    return Promise.resolve(result.results[0] || null);
  }

  run<T = unknown>(): Promise<D1Response<T>> {
    return Promise.resolve(this.db._executeQuery<T>(this.query, this.bindings));
  }

  all<T = unknown>(): Promise<D1Result<T>> {
    const result = this.db._executeQuery<T>(this.query, this.bindings);
    return Promise.resolve({
      results: result.results,
      success: result.success,
      meta: {
        duration: result.meta.duration,
        rows_read: result.meta.rows_read,
        rows_written: result.meta.rows_written,
      },
    });
  }

  raw<T = unknown>(): Promise<T[]> {
    return Promise.resolve([]);
  }
}

// ============================================================================
// Mock Factory
// ============================================================================

export function createMockD1Database(): MockD1Database {
  return new MockD1Database();
}

/**
 * Creates a mock D1 binding for use in Cloudflare Worker tests
 */
export function createMockD1Binding(): D1DatabaseInterface {
  return createMockD1Database() as unknown as D1DatabaseInterface;
}

/**
 * Resets the global D1 mock state
 */
export function resetD1Mocks(): void {
  // Global reset if using singleton pattern
}
