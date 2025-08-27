import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Database migration utilities
 */

export interface Migration {
  id: string;
  description: string;
  up: string;
  down?: string;
  applied_at?: Date;
}

// Create migrations table if it doesn't exist
export async function createMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// Get applied migrations
export async function getAppliedMigrations(): Promise<string[]> {
  await createMigrationsTable();
  
  const result = await sql`
    SELECT id FROM migrations ORDER BY applied_at ASC
  `;

  return result.rows.map(row => row.id);
}

// Record migration as applied
export async function recordMigration(id: string, description: string): Promise<void> {
  await sql`
    INSERT INTO migrations (id, description)
    VALUES (${id}, ${description})
    ON CONFLICT (id) DO NOTHING
  `;
}

// Remove migration record
export async function removeMigrationRecord(id: string): Promise<void> {
  await sql`
    DELETE FROM migrations WHERE id = ${id}
  `;
}

// Run a single migration
export async function runMigration(migrationSQL: string): Promise<void> {
  // Execute migration in a transaction
  await sql`BEGIN`;
  try {
    await sql.query(migrationSQL);
    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

// Apply pending migrations
export async function applyMigrations(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();
  
  // Define available migrations
  const migrations: Migration[] = [
    {
      id: '001_initial_schema',
      description: 'Create initial database schema for investor portal',
      up: readMigrationFile('001_initial_schema.sql'),
      down: readMigrationFile('rollback_001_initial_schema.sql')
    }
  ];

  for (const migration of migrations) {
    if (!appliedMigrations.includes(migration.id)) {
      console.log(`Applying migration: ${migration.id} - ${migration.description}`);
      
      try {
        await runMigration(migration.up);
        await recordMigration(migration.id, migration.description);
        console.log(`✓ Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`✗ Migration ${migration.id} failed:`, error);
        throw error;
      }
    }
  }
}

// Rollback the last migration
export async function rollbackLastMigration(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();
  
  if (appliedMigrations.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const lastMigrationId = appliedMigrations[appliedMigrations.length - 1];
  
  // Map migration IDs to their rollback SQL
  const rollbackMap: Record<string, string> = {
    '001_initial_schema': readMigrationFile('rollback_001_initial_schema.sql')
  };

  const rollbackSQL = rollbackMap[lastMigrationId];
  if (!rollbackSQL) {
    throw new Error(`No rollback script found for migration: ${lastMigrationId}`);
  }

  console.log(`Rolling back migration: ${lastMigrationId}`);
  
  try {
    await runMigration(rollbackSQL);
    await removeMigrationRecord(lastMigrationId);
    console.log(`✓ Migration ${lastMigrationId} rolled back successfully`);
  } catch (error) {
    console.error(`✗ Rollback of ${lastMigrationId} failed:`, error);
    throw error;
  }
}

// Reset database (rollback all migrations)
export async function resetDatabase(): Promise<void> {
  const appliedMigrations = await getAppliedMigrations();
  
  // Rollback migrations in reverse order
  for (let i = appliedMigrations.length - 1; i >= 0; i--) {
    const migrationId = appliedMigrations[i];
    
    const rollbackMap: Record<string, string> = {
      '001_initial_schema': readMigrationFile('rollback_001_initial_schema.sql')
    };

    const rollbackSQL = rollbackMap[migrationId];
    if (!rollbackSQL) {
      console.warn(`No rollback script found for migration: ${migrationId}, skipping`);
      continue;
    }

    console.log(`Rolling back migration: ${migrationId}`);
    
    try {
      await runMigration(rollbackSQL);
      await removeMigrationRecord(migrationId);
      console.log(`✓ Migration ${migrationId} rolled back successfully`);
    } catch (error) {
      console.error(`✗ Rollback of ${migrationId} failed:`, error);
      throw error;
    }
  }

  // Drop migrations table
  await sql`DROP TABLE IF EXISTS migrations`;
}

// Check migration status
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
}> {
  const appliedMigrations = await getAppliedMigrations();
  const allMigrations = ['001_initial_schema']; // Add new migration IDs here
  
  const pending = allMigrations.filter(id => !appliedMigrations.includes(id));

  return {
    applied: appliedMigrations,
    pending
  };
}

// Helper function to read migration files
function readMigrationFile(filename: string): string {
  try {
    const migrationPath = join(process.cwd(), 'src', 'lib', 'migrations', filename);
    return readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read migration file ${filename}: ${error}`);
  }
}

// Validate database connection and schema
export async function validateDatabase(): Promise<{
  connected: boolean;
  tables: string[];
  migrationsApplied: string[];
}> {
  try {
    // Test connection
    await sql`SELECT 1`;
    
    // Get table list
    const tablesResult = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    const tables = tablesResult.rows.map(row => row.tablename);
    const migrationsApplied = await getAppliedMigrations();

    return {
      connected: true,
      tables,
      migrationsApplied
    };
  } catch (error) {
    console.error('Database validation failed:', error);
    return {
      connected: false,
      tables: [],
      migrationsApplied: []
    };
  }
}