-- Migration: 002_file_enhancements
-- Description: Add enhanced file metadata for security, encryption, and virus scanning
-- Created: 2025-08-27

-- Add new columns to documents table for enhanced security
ALTER TABLE documents ADD COLUMN IF NOT EXISTS blob_url VARCHAR(2000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encryption_key_id VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error', 'skipped'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_scan_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS compression_ratio DECIMAL(5,4);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_size BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) NOT NULL DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'restricted', 'confidential'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS data_room_id UUID REFERENCES data_rooms(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_path VARCHAR(1000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(2000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS allowed_user_ids UUID[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS allowed_role_types VARCHAR(50)[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS watermark_text VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN NOT NULL DEFAULT false;

-- Create file_access_logs table for detailed file access tracking
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL CHECK (action IN ('upload', 'download', 'view', 'delete', 'share', 'preview', 'thumbnail')),
    ip_address INET,
    user_agent TEXT,
    file_size BIGINT,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    additional_metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create file_permissions table for granular access control
CREATE TABLE IF NOT EXISTS file_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('read', 'download', 'share', 'delete', 'admin')),
    granted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(document_id, user_id, permission_type)
);

-- Create signed_urls table to track temporary access URLs
CREATE TABLE IF NOT EXISTS signed_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    url_token VARCHAR(255) NOT NULL UNIQUE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('download', 'preview', 'thumbnail')),
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    ip_restrictions INET[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false
);

-- Create storage_quotas table for user/organization limits
CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10GB default
    used_bytes BIGINT NOT NULL DEFAULT 0,
    file_count INTEGER NOT NULL DEFAULT 0,
    max_file_size BIGINT NOT NULL DEFAULT 104857600, -- 100MB default
    allowed_mime_types VARCHAR(100)[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new access log actions to existing enum check
ALTER TABLE access_logs DROP CONSTRAINT IF EXISTS access_logs_action_check;
ALTER TABLE access_logs ADD CONSTRAINT access_logs_action_check 
CHECK (action IN ('login', 'logout', 'document_view', 'document_download', 'data_room_access', 'file_upload', 'file_delete', 'file_share', 'permission_grant', 'permission_revoke'));

-- Create indexes for new columns and tables

-- Documents table new indexes
CREATE INDEX IF NOT EXISTS idx_documents_blob_url ON documents(blob_url);
CREATE INDEX IF NOT EXISTS idx_documents_is_encrypted ON documents(is_encrypted);
CREATE INDEX IF NOT EXISTS idx_documents_hash_sha256 ON documents(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_documents_virus_scan_status ON documents(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_data_room_id ON documents(data_room_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_path ON documents(folder_path);
CREATE INDEX IF NOT EXISTS idx_documents_download_count ON documents(download_count);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_allowed_user_ids ON documents USING gin(allowed_user_ids);

-- File access logs indexes
CREATE INDEX IF NOT EXISTS idx_file_access_logs_document_id ON file_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_action ON file_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_timestamp ON file_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_ip_address ON file_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_success ON file_access_logs(success);

-- File permissions indexes
CREATE INDEX IF NOT EXISTS idx_file_permissions_document_id ON file_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_user_id ON file_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_type ON file_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_file_permissions_active ON file_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_file_permissions_expires ON file_permissions(expires_at);

-- Signed URLs indexes
CREATE INDEX IF NOT EXISTS idx_signed_urls_document_id ON signed_urls(document_id);
CREATE INDEX IF NOT EXISTS idx_signed_urls_token ON signed_urls(url_token);
CREATE INDEX IF NOT EXISTS idx_signed_urls_expires ON signed_urls(expires_at);
CREATE INDEX IF NOT EXISTS idx_signed_urls_user_id ON signed_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_urls_revoked ON signed_urls(is_revoked);

-- Storage quotas indexes
CREATE INDEX IF NOT EXISTS idx_storage_quotas_user_id ON storage_quotas(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_storage_quotas_updated_at BEFORE UPDATE ON storage_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update storage quota usage
CREATE OR REPLACE FUNCTION update_storage_quota_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase quota usage
        INSERT INTO storage_quotas (user_id, used_bytes, file_count)
        VALUES (NEW.uploaded_by, NEW.file_size, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            used_bytes = storage_quotas.used_bytes + NEW.file_size,
            file_count = storage_quotas.file_count + 1,
            updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease quota usage
        UPDATE storage_quotas 
        SET 
            used_bytes = GREATEST(0, used_bytes - OLD.file_size),
            file_count = GREATEST(0, file_count - 1),
            updated_at = NOW()
        WHERE user_id = OLD.uploaded_by;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update quota usage if file size changed
        IF OLD.file_size != NEW.file_size THEN
            UPDATE storage_quotas 
            SET 
                used_bytes = used_bytes - OLD.file_size + NEW.file_size,
                updated_at = NOW()
            WHERE user_id = NEW.uploaded_by;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update storage quotas
CREATE TRIGGER update_storage_quota_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_storage_quota_usage();

-- Create function to clean up expired signed URLs
CREATE OR REPLACE FUNCTION cleanup_expired_signed_urls()
RETURNS void AS $$
BEGIN
    DELETE FROM signed_urls 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Add comments to new tables and columns
COMMENT ON TABLE file_access_logs IS 'Detailed audit trail for file access operations';
COMMENT ON TABLE file_permissions IS 'Granular file access permissions for users';
COMMENT ON TABLE signed_urls IS 'Temporary signed URLs for secure file access';
COMMENT ON TABLE storage_quotas IS 'Storage quotas and usage tracking per user';

COMMENT ON COLUMN documents.blob_url IS 'Vercel Blob storage URL';
COMMENT ON COLUMN documents.encryption_key_id IS 'Reference to encryption key used';
COMMENT ON COLUMN documents.is_encrypted IS 'Whether file content is encrypted';
COMMENT ON COLUMN documents.hash_sha256 IS 'SHA256 hash for file integrity verification';
COMMENT ON COLUMN documents.virus_scan_status IS 'Virus scanning status';
COMMENT ON COLUMN documents.access_level IS 'Security classification level';
COMMENT ON COLUMN documents.folder_path IS 'Virtual folder organization path';
COMMENT ON COLUMN documents.download_count IS 'Number of times file has been downloaded';
COMMENT ON COLUMN documents.expires_at IS 'Optional expiration date for temporary files';
COMMENT ON COLUMN documents.allowed_user_ids IS 'Array of user IDs with explicit access';
COMMENT ON COLUMN documents.watermark_text IS 'Text to overlay on downloaded files';

-- Create default storage quotas for existing users
INSERT INTO storage_quotas (user_id)
SELECT id FROM users 
WHERE NOT EXISTS (
    SELECT 1 FROM storage_quotas WHERE storage_quotas.user_id = users.id
);