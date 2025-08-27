-- Rollback Migration: 001_initial_schema
-- Description: Rollback initial database schema for investor portal
-- Created: 2025-08-27

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_data_rooms_updated_at ON data_rooms;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS data_room_documents;
DROP TABLE IF EXISTS data_rooms;
DROP TABLE IF EXISTS access_logs;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;

-- Drop the UUID extension if it was created by this migration
-- Note: Only drop if no other objects depend on it
-- DROP EXTENSION IF EXISTS "uuid-ossp";