# Database Setup Guide - Idlewood Capital Investor Portal

This guide will help you set up the Vercel Postgres database for the investor portal.

## Prerequisites

- Node.js 18+ installed
- A Vercel account with Postgres database created
- Database connection string (POSTGRES_URL)

## Quick Start

1. **Configure Environment Variables**
   
   Create a `.env.local` file in the project root:
   ```bash
   # Required: Your Vercel Postgres connection string
   POSTGRES_URL="postgres://username:password@host:port/database?sslmode=require"
   
   # Optional: Admin user credentials for seeding
   ADMIN_EMAIL="admin@idlewood-capital.com"
   ADMIN_PASSWORD="your-secure-password-here"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Database Setup**
   ```bash
   # Apply database migrations
   npm run db:migrate
   
   # Seed initial data (admin user, sample data)
   npm run db:seed
   ```

Your database is now ready! 🎉

## Database Schema

The investor portal uses the following tables:

### Users Table
- **Purpose**: Store user accounts (admin, investors, users)
- **Key Fields**: id, email, password_hash, role, company_name, is_active
- **Relationships**: Referenced by documents, data_rooms, access_logs

### Documents Table
- **Purpose**: Store file metadata for uploaded documents
- **Key Fields**: id, file_name, file_path, file_size, mime_type, is_public
- **Relationships**: Links to users (uploader), used in data_rooms

### Access Logs Table
- **Purpose**: Audit trail for user actions and document access
- **Key Fields**: id, user_id, document_id, action, ip_address, timestamp
- **Relationships**: Links to users and documents

### Data Rooms Table
- **Purpose**: Secure document sharing with access codes
- **Key Fields**: id, name, access_code, expires_at, is_active
- **Relationships**: Created by users, contains documents

### Data Room Documents Table
- **Purpose**: Junction table linking data rooms to documents
- **Key Fields**: data_room_id, document_id, added_at
- **Relationships**: Links data_rooms and documents

## Available Database Commands

### Migration Commands
```bash
# Apply pending migrations
npm run db:migrate

# Rollback the last migration
npm run db:rollback

# Reset database (⚠️ DESTRUCTIVE - removes all data)
npm run db:reset

# Check migration status
npm run db:status

# Validate database connection and schema
npm run db:validate
```

### Seeding Commands
```bash
# Seed database with initial data
npm run db:seed
```

## Database Configuration

### Connection Management
The database uses Vercel Postgres with connection pooling:
- Connection string: Set via `POSTGRES_URL` environment variable
- Automatic connection pooling for serverless functions
- Prepared statements for SQL injection prevention
- Transaction support for data consistency

### Security Features
- **Password Hashing**: bcrypt with 12 rounds
- **UUID Primary Keys**: All tables use UUID for primary keys
- **Foreign Key Constraints**: Maintain referential integrity
- **Audit Trail**: Access logs track all user actions
- **Soft Deletes**: Users and data rooms use soft deletion (is_active flag)

### Performance Optimizations
- **Indexes**: Strategic indexes on foreign keys and frequently queried fields
- **Full-text Search**: PostgreSQL full-text search on document names
- **Pagination**: Built-in pagination support for all query functions
- **Connection Pooling**: Optimized for serverless environments

## Environment Variables

### Required
- `POSTGRES_URL`: Your Vercel Postgres connection string

### Optional
- `ADMIN_EMAIL`: Email for initial admin user (default: admin@idlewood-capital.com)
- `ADMIN_PASSWORD`: Password for initial admin user (default: admin123!)

## Using the Database in Your Code

### Basic Usage
```typescript
import { 
  createUser, 
  getUserByEmail, 
  createDocument,
  createDataRoom 
} from '@/lib/database';

// Create a new user
const user = await createUser({
  email: 'investor@example.com',
  password: 'securepassword',
  role: 'investor',
  company_name: 'Example Corp'
});

// Get user by email
const existingUser = await getUserByEmail('investor@example.com');

// Create a document
const document = await createDocument({
  file_name: 'investment-summary.pdf',
  file_path: '/uploads/investment-summary.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf',
  uploaded_by: user.id,
  is_public: false
});
```

### Transaction Example
```typescript
import { withTransaction } from '@/lib/database';

const result = await withTransaction(async (sql) => {
  // Multiple operations within a transaction
  const user = await createUser({ ... });
  const document = await createDocument({ ... });
  return { user, document };
});
```

## TypeScript Integration

All database operations are fully typed:

```typescript
import type { 
  User, 
  Document, 
  CreateUserInput,
  UserRole 
} from '@/lib/types/database';

// Type-safe user creation
const userData: CreateUserInput = {
  email: 'user@example.com',
  password: 'password',
  role: UserRole.INVESTOR
};

const user: User = await createUser(userData);
```

## Troubleshooting

### Connection Issues
1. **Check Environment Variables**: Ensure `POSTGRES_URL` is correctly set
2. **Verify Database Exists**: Make sure your Vercel Postgres database is created
3. **Network Access**: Ensure your environment can reach Vercel's database

### Migration Issues
1. **Check Migration Status**: Run `npm run db:status`
2. **Validate Database**: Run `npm run db:validate`
3. **Reset if Needed**: Run `npm run db:reset` (⚠️ removes all data)

### Common Error Messages
- **"relation does not exist"**: Run migrations with `npm run db:migrate`
- **"duplicate key value"**: User/data already exists, check for existing records
- **"connection refused"**: Check your `POSTGRES_URL` environment variable

## Development Workflow

1. **Make Schema Changes**: Update migration files in `src/lib/migrations/`
2. **Test Migrations**: Run `npm run db:migrate` in development
3. **Update Types**: Modify TypeScript types in `src/lib/types/database.ts`
4. **Update Functions**: Add/modify database functions in `src/lib/database/`
5. **Test Changes**: Run `npm run db:validate` to ensure everything works

## Production Deployment

1. **Set Environment Variables**: Configure `POSTGRES_URL` in Vercel dashboard
2. **Run Migrations**: Migrations run automatically on deployment
3. **Seed Initial Data**: Run seeding manually in production if needed
4. **Monitor Performance**: Use Vercel's database monitoring tools

## Backup and Maintenance

### Regular Maintenance
- **Access Log Cleanup**: Use `deleteOldAccessLogs()` to clean old logs
- **Expired Data Rooms**: Use `deactivateExpiredDataRooms()` to clean expired rooms
- **User Management**: Regularly audit user accounts and permissions

### Backup Strategy
- Vercel Postgres provides automated backups
- Consider exporting critical data regularly for additional safety
- Test restore procedures periodically

## Security Best Practices

1. **Use Environment Variables**: Never commit database credentials to code
2. **Strong Passwords**: Use secure passwords for admin accounts
3. **Regular Updates**: Keep dependencies updated
4. **Access Control**: Implement proper role-based access control
5. **Audit Logging**: Monitor access logs for suspicious activity
6. **SSL/TLS**: Always use encrypted connections (enforced by default)

## Support

For database-related issues:
1. Check this documentation first
2. Run database validation: `npm run db:validate`
3. Check Vercel Postgres documentation
4. Review application logs for detailed error messages

---

**Note**: This database setup is designed specifically for the Idlewood Capital investor portal. Modify as needed for your specific requirements.