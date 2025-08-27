# Secure File Storage System Setup

This document provides setup instructions for the secure file storage system implemented for the Idlewood Capital investor portal.

## Overview

The file storage system provides:
- **Secure uploads** with encryption and virus scanning
- **Granular access control** with role-based permissions
- **Audit logging** for compliance tracking
- **File organization** with data rooms and folders
- **Temporary access** via signed URLs
- **Storage quotas** and monitoring
- **Admin management** capabilities

## Architecture

### Components

1. **Vercel Blob Storage** - Primary file storage backend
2. **PostgreSQL Database** - Metadata, permissions, and audit logs
3. **Encryption Layer** - AES-256-GCM file encryption
4. **Access Control** - Role-based and document-specific permissions
5. **Audit System** - Comprehensive logging for compliance
6. **Data Rooms** - Secure document sharing spaces

### Security Features

- **File encryption** at rest using AES-256-GCM
- **Virus scanning** preparation with status tracking
- **Access logging** for all file operations
- **Signed URLs** for temporary secure access
- **Permission system** with granular controls
- **Input validation** and file type restrictions
- **Storage quotas** to prevent abuse

## Database Setup

### 1. Run Migration

Apply the enhanced database schema:

```bash
npm run db:migrate
```

This will create the following new tables:
- Enhanced `documents` table with security fields
- `file_access_logs` for detailed audit trails
- `file_permissions` for granular access control
- `signed_urls` for temporary access management
- `storage_quotas` for usage tracking

### 2. Verify Schema

Check that all tables were created successfully:

```bash
npm run db:status
```

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Vercel Blob Storage (Required)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
BLOB_BASE_URL=https://your-blob-url.com

# File Encryption (Required for security)
FILE_ENCRYPTION_ENABLED=true
FILE_ENCRYPTION_KEY=your-32-character-encryption-key

# File Limits (Optional - defaults provided)
MAX_FILE_SIZE=104857600          # 100MB
DEFAULT_QUOTA_BYTES=10737418240  # 10GB
MAX_FILES_PER_USER=1000

# Security Settings
VIRUS_SCANNING_ENABLED=true
FILE_COMPRESSION_ENABLED=true
THUMBNAIL_ENABLED=true
```

### Vercel Blob Setup

1. Go to your Vercel dashboard
2. Navigate to Storage → Blob
3. Create a new blob store
4. Copy the `BLOB_READ_WRITE_TOKEN`

### Encryption Key Generation

Generate a secure 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### File Operations

- `POST /api/files/upload` - Upload files with security
- `GET /api/files/download/[id]` - Download with access control
- `GET /api/files/access/[token]` - Access via signed URL
- `GET /api/files/search` - Search files with filtering
- `GET /api/files/[id]` - Get file metadata
- `PUT /api/files/[id]` - Update file settings
- `DELETE /api/files/[id]` - Delete file
- `POST /api/files/share/[id]` - Create share link

### Admin Operations

- `GET /api/files/admin/stats` - System statistics
- `GET /api/files/admin/users/[id]` - User file management
- `POST /api/files/admin/bulk` - Bulk operations
- `GET /api/files/quota` - Storage quota management

### Storage Management

- `GET /api/files/quota` - Get quota information
- `PUT /api/files/quota` - Update quotas (admin)

## React Components

### FileUpload Component

```jsx
import { FileUpload } from '@/components/files/FileUpload';

function MyPage() {
  return (
    <FileUpload
      onUploadComplete={(result) => console.log('Upload done:', result)}
      onUploadProgress={(progress) => console.log('Progress:', progress)}
      maxFileSize={100 * 1024 * 1024} // 100MB
      allowedTypes={['application/pdf', 'image/*']}
      encrypt={true}
      compress={true}
      accessLevel="confidential"
    />
  );
}
```

### FileManager Component

```jsx
import { FileManager } from '@/components/files/FileManager';

function DocumentsPage() {
  return (
    <FileManager
      userId={currentUserId}
      dataRoomId={dataRoomId} // Optional
      allowUpload={true}
      allowDelete={hasDeletePermission}
      allowShare={hasSharePermission}
      onFileSelect={(file) => console.log('Selected:', file)}
      onFileDownload={(file) => console.log('Downloaded:', file)}
    />
  );
}
```

## Security Best Practices

### File Upload Security

1. **Validate file types** - Check both MIME type and file signature
2. **Scan for viruses** - Implement virus scanning integration
3. **Encrypt sensitive files** - Enable encryption for confidential documents
4. **Size limits** - Enforce upload size limits
5. **Storage quotas** - Monitor and limit storage usage

### Access Control

1. **Principle of least privilege** - Grant minimal required permissions
2. **Time-based access** - Use expiring permissions when appropriate
3. **Audit logging** - Log all file access operations
4. **Regular reviews** - Periodically review access permissions

### Data Rooms

1. **Access codes** - Use secure, unique access codes
2. **Expiration dates** - Set appropriate expiration times
3. **User tracking** - Monitor who accesses data rooms
4. **Document organization** - Use clear folder structures

## File Operations

### Upload Process

1. **Client validation** - File type, size, name validation
2. **Server validation** - Security checks and virus scan prep
3. **Encryption** - Encrypt sensitive files using AES-256-GCM
4. **Storage** - Upload to Vercel Blob with secure path
5. **Database** - Store metadata with security attributes
6. **Audit log** - Record upload activity

### Download Process

1. **Authentication** - Verify user identity
2. **Permission check** - Validate access rights
3. **File retrieval** - Fetch from Vercel Blob
4. **Decryption** - Decrypt if file is encrypted
5. **Delivery** - Serve with appropriate headers
6. **Audit log** - Record download activity

### Access Control Flow

1. **Permission evaluation** - Check user roles and explicit permissions
2. **Document rules** - Apply document-specific access rules
3. **Time limits** - Enforce expiration dates
4. **Data room access** - Validate data room membership
5. **Audit trail** - Log all access attempts

## Monitoring and Maintenance

### Storage Monitoring

```javascript
// Get storage statistics
const stats = await fetch('/api/files/admin/stats').then(r => r.json());

// Check user quota
const quota = await fetch('/api/files/quota').then(r => r.json());

// Monitor access logs
const logs = await fetch('/api/files/admin/audit').then(r => r.json());
```

### Regular Maintenance Tasks

1. **Clean expired URLs** - Remove old signed URLs
2. **Audit permissions** - Review and update access permissions
3. **Storage cleanup** - Remove orphaned files
4. **Security review** - Regular security assessments
5. **Backup verification** - Ensure backups are working

### Performance Optimization

1. **CDN configuration** - Use CDN for public files
2. **Compression** - Enable file compression for large files
3. **Thumbnail generation** - Generate thumbnails for images
4. **Database indexing** - Optimize database queries
5. **Caching strategy** - Implement appropriate caching

## Error Handling

### Common Error Codes

- `FILE_NOT_FOUND` - File doesn't exist or not accessible
- `ACCESS_DENIED` - Insufficient permissions
- `QUOTA_EXCEEDED` - Storage quota exceeded
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - File type not allowed
- `VIRUS_DETECTED` - File failed security scan
- `ENCRYPTION_FAILED` - File encryption error
- `UPLOAD_FAILED` - Upload process error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Storage quota exceeded",
    "details": {
      "usedBytes": 10737418240,
      "quotaBytes": 10737418240,
      "fileSize": 1048576
    }
  }
}
```

## Production Deployment

### Security Checklist

- [ ] Encryption keys are secure and unique
- [ ] Vercel Blob is properly configured
- [ ] Environment variables are set
- [ ] Database migrations are applied
- [ ] Access logging is enabled
- [ ] Storage quotas are configured
- [ ] File type restrictions are in place
- [ ] Virus scanning is configured
- [ ] HTTPS is enforced
- [ ] CORS policies are restrictive

### Performance Checklist

- [ ] CDN is configured for public files
- [ ] Database indexes are optimized
- [ ] File compression is enabled
- [ ] Thumbnail generation is working
- [ ] Signed URL cleanup is scheduled
- [ ] Monitoring is in place

## Compliance Features

### Audit Trail

The system maintains comprehensive audit logs including:
- File upload/download activities
- Permission changes
- Data room access
- Administrative actions
- Failed access attempts

### Data Protection

- **Encryption at rest** - Files encrypted with AES-256-GCM
- **Access controls** - Granular permission system
- **Data retention** - Configurable file expiration
- **Secure deletion** - Permanent file removal
- **Audit logs** - Immutable access records

### Regulatory Compliance

The system is designed to support:
- **SOC 2** compliance with access controls and logging
- **GDPR** compliance with data retention and deletion
- **Financial regulations** with audit trails and access controls
- **Industry standards** with encryption and security measures

## Troubleshooting

### Common Issues

1. **Upload failures** - Check file size limits and storage quotas
2. **Permission errors** - Verify user roles and document permissions
3. **Encryption issues** - Validate encryption key configuration
4. **Storage errors** - Check Vercel Blob token and configuration
5. **Performance issues** - Review database indexes and file sizes

### Debug Information

Enable debug logging by setting `NODE_ENV=development` and check:
- Server logs for API errors
- Browser console for client-side issues
- Database queries for performance problems
- File access patterns for permission issues

## Support and Maintenance

For ongoing support:
1. Monitor audit logs for security issues
2. Review storage usage regularly
3. Update access permissions as needed
4. Perform regular security assessments
5. Keep dependencies updated

---

## Implementation Summary

✅ **Completed Features:**

1. **Core Infrastructure**
   - Vercel Blob SDK integration
   - Enhanced database schema with security fields
   - File encryption and decryption utilities
   - Comprehensive TypeScript types

2. **Upload System**
   - Secure file upload API with validation
   - Progress tracking and error handling
   - File compression and optimization
   - Virus scanning preparation

3. **Download System**
   - Access-controlled file downloads
   - Signed URL generation for temporary access
   - File decryption and delivery
   - Comprehensive audit logging

4. **Permission System**
   - Role-based access control
   - Document-specific permissions
   - Data room access management
   - Time-based access controls

5. **Admin Features**
   - Bulk file operations
   - User file management
   - System statistics and monitoring
   - Storage quota management

6. **UI Components**
   - File upload with drag & drop
   - File manager with search and filtering
   - Progress tracking and error display
   - Responsive design with accessibility

7. **Data Organization**
   - Data room file organization
   - Folder-based file structure
   - User-specific file spaces
   - Hierarchical permission inheritance

8. **Security Features**
   - AES-256-GCM encryption
   - File type validation and security scanning
   - Comprehensive audit logging
   - Storage quotas and monitoring
   - Secure temporary access via signed URLs

The secure file storage system is now ready for production use with enterprise-grade security, comprehensive audit logging, and scalable architecture suitable for investor document management.

All components integrate seamlessly with the existing authentication and database systems, ensuring consistency and maintainability.