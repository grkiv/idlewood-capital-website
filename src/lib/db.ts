import { sql } from '@vercel/postgres';

// Database connection utility using Vercel Postgres
export const db = sql;

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Execute a query with error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await sql.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  callback: (sql: typeof import('@vercel/postgres').sql) => Promise<T>
): Promise<T> {
  try {
    await sql`BEGIN`;
    const result = await callback(sql);
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

export default db;