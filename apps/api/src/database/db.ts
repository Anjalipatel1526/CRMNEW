import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';

let pgliteInstance: PGlite | null = null;
let pgPoolInstance: Pool | null = null;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface DbClient {
  query<T = any>(sqlText: string, params?: any[]): Promise<QueryResult<T>>;
}

export async function getDb(): Promise<DbClient> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    if (!pgPoolInstance) {
      pgPoolInstance = new Pool({ connectionString: databaseUrl });
    }
    return pgPoolInstance;
  }

  if (!pgliteInstance) {
    // Persistent directory for development so data survives restarts
    const dataDir = path.resolve(process.cwd(), '.data/pg');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
  }

  return pgliteInstance;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema creation (multi-statement script)
  if (typeof (db as any).exec === 'function') {
    await (db as any).exec(schemaSql);
  } else {
    await db.query(schemaSql);
  }
  console.log('[Database] PostgreSQL schema initialized successfully.');
}

export async function query<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const result = await db.query<T>(sqlText, params);
  return result.rows || [];
}

export async function queryOne<T = any>(sqlText: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlText, params);
  return rows[0] || null;
}

export async function execute(sqlText: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.query(sqlText, params);
}
