#!/usr/bin/env ts-node

/**
 * Database management CLI script
 * Provides utilities for managing the database schema and data
 */

import { config } from 'dotenv';
import { 
  applyMigrations,
  rollbackLastMigration,
  resetDatabase,
  getMigrationStatus,
  validateDatabase
} from '../src/lib/database';

// Load environment variables
config();

const commands = {
  migrate: 'Apply pending database migrations',
  rollback: 'Rollback the last applied migration',
  reset: 'Reset database (rollback all migrations)',
  status: 'Show migration status',
  validate: 'Validate database connection and schema'
};

async function runCommand(command: string) {
  console.log(`🔧 Running command: ${command}`);
  console.log('');

  try {
    switch (command) {
      case 'migrate':
        await applyMigrations();
        console.log('✅ Migrations applied successfully');
        break;

      case 'rollback':
        await rollbackLastMigration();
        console.log('✅ Last migration rolled back successfully');
        break;

      case 'reset':
        console.log('⚠️  WARNING: This will destroy all data in the database!');
        console.log('Type "yes" to confirm:');
        
        // In a real CLI, you'd prompt for user input
        // For this script, we'll require explicit confirmation
        if (process.argv.includes('--confirm')) {
          await resetDatabase();
          console.log('✅ Database reset completed');
        } else {
          console.log('❌ Reset cancelled. Use --confirm flag to proceed.');
        }
        break;

      case 'status':
        const status = await getMigrationStatus();
        console.log('📊 Migration Status:');
        console.log('');
        console.log('Applied migrations:');
        if (status.applied.length === 0) {
          console.log('  (none)');
        } else {
          status.applied.forEach(migration => {
            console.log(`  ✓ ${migration}`);
          });
        }
        console.log('');
        console.log('Pending migrations:');
        if (status.pending.length === 0) {
          console.log('  (none)');
        } else {
          status.pending.forEach(migration => {
            console.log(`  ⏳ ${migration}`);
          });
        }
        break;

      case 'validate':
        const validation = await validateDatabase();
        console.log('🔍 Database Validation:');
        console.log('');
        console.log(`Connection: ${validation.connected ? '✅ Connected' : '❌ Failed'}`);
        console.log(`Tables found: ${validation.tables.length}`);
        
        if (validation.tables.length > 0) {
          console.log('  Tables:');
          validation.tables.forEach(table => {
            console.log(`    • ${table}`);
          });
        }
        
        console.log(`Migrations applied: ${validation.migrationsApplied.length}`);
        if (validation.migrationsApplied.length > 0) {
          validation.migrationsApplied.forEach(migration => {
            console.log(`    • ${migration}`);
          });
        }
        break;

      default:
        console.log('❌ Unknown command:', command);
        console.log('');
        console.log('Available commands:');
        Object.entries(commands).forEach(([cmd, desc]) => {
          console.log(`  ${cmd.padEnd(10)} - ${desc}`);
        });
        process.exit(1);
    }

    console.log('');
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

if (!command) {
  console.log('📚 Database Management CLI');
  console.log('');
  console.log('Usage: ts-node scripts/db-management.ts <command>');
  console.log('');
  console.log('Available commands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(10)} - ${desc}`);
  });
  process.exit(1);
}

// Run the command
if (require.main === module) {
  runCommand(command).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runCommand };