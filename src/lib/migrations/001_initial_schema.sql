-- Migration: 001_initial_schema
-- Description: Create initial database schema for investor portal
-- Created: 2025-08-27

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'investor', 'user')),
    company_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_public BOOLEAN NOT NULL DEFAULT false
);

-- Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL CHECK (action IN ('login', 'logout', 'document_view', 'document_download', 'data_room_access')),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create data_rooms table
CREATE TABLE IF NOT EXISTS data_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    access_code VARCHAR(255) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create data_room_documents junction table
CREATE TABLE IF NOT EXISTS data_room_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_room_id UUID NOT NULL REFERENCES data_rooms(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(data_room_id, document_id)
);

-- Create indexes for better query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_mime_type ON documents(mime_type);
CREATE INDEX IF NOT EXISTS idx_documents_file_name ON documents USING gin(to_tsvector('english', file_name));

-- Access logs table indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_document_id ON access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip_address ON access_logs(ip_address);

-- Data rooms table indexes
CREATE INDEX IF NOT EXISTS idx_data_rooms_created_by ON data_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_data_rooms_access_code ON data_rooms(access_code);
CREATE INDEX IF NOT EXISTS idx_data_rooms_expires_at ON data_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_data_rooms_is_active ON data_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_data_rooms_created_at ON data_rooms(created_at);

-- Data room documents table indexes
CREATE INDEX IF NOT EXISTS idx_data_room_documents_room_id ON data_room_documents(data_room_id);
CREATE INDEX IF NOT EXISTS idx_data_room_documents_document_id ON data_room_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_data_room_documents_added_at ON data_room_documents(added_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_rooms_updated_at BEFORE UPDATE ON data_rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables for documentation
COMMENT ON TABLE users IS 'User accounts for the investor portal';
COMMENT ON TABLE documents IS 'File storage metadata for uploaded documents';
COMMENT ON TABLE access_logs IS 'Audit trail for user actions and document access';
COMMENT ON TABLE data_rooms IS 'Secure document sharing rooms with access codes';
COMMENT ON TABLE data_room_documents IS 'Junction table linking data rooms to documents';

-- Add comments to important columns
COMMENT ON COLUMN users.role IS 'User role: admin, investor, or user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN documents.is_public IS 'Whether the document is publicly accessible';
COMMENT ON COLUMN access_logs.action IS 'Type of action performed by the user';
COMMENT ON COLUMN data_rooms.access_code IS 'Unique access code for the data room';
COMMENT ON COLUMN data_rooms.expires_at IS 'Optional expiration date for the data room';