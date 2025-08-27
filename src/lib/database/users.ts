import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserWithStats,
  UserRole,
  PaginationParams
} from '../types/database';

/**
 * User database operations
 */

// Create a new user
export async function createUser(userData: CreateUserInput): Promise<User> {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(userData.password, 12);
  
  const result = await sql`
    INSERT INTO users (
      id, email, password_hash, role, company_name, is_active
    ) VALUES (
      ${id},
      ${userData.email.toLowerCase()},
      ${passwordHash},
      ${userData.role || UserRole.USER},
      ${userData.company_name || null},
      ${userData.is_active !== false}
    )
    RETURNING id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
  `;

  return result.rows[0] as User;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
    FROM users
    WHERE id = ${id} AND is_active = true
  `;

  return result.rows[0] as User || null;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
    FROM users
    WHERE email = ${email.toLowerCase()} AND is_active = true
  `;

  return result.rows[0] as User || null;
}

// Update user
export async function updateUser(id: string, updates: UpdateUserInput): Promise<User | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (updates.email !== undefined) {
    setParts.push(`email = $${valueIndex++}`);
    values.push(updates.email.toLowerCase());
  }
  if (updates.role !== undefined) {
    setParts.push(`role = $${valueIndex++}`);
    values.push(updates.role);
  }
  if (updates.company_name !== undefined) {
    setParts.push(`company_name = $${valueIndex++}`);
    values.push(updates.company_name);
  }
  if (updates.is_active !== undefined) {
    setParts.push(`is_active = $${valueIndex++}`);
    values.push(updates.is_active);
  }
  if (updates.last_login !== undefined) {
    setParts.push(`last_login = $${valueIndex++}`);
    values.push(updates.last_login);
  }

  if (setParts.length === 0) {
    return await getUserById(id);
  }

  values.push(id);
  const query = `
    UPDATE users 
    SET ${setParts.join(', ')}, updated_at = NOW()
    WHERE id = $${valueIndex} AND is_active = true
    RETURNING id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as User || null;
}

// Update user password
export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  const result = await sql`
    UPDATE users 
    SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${id} AND is_active = true
  `;

  return result.rowCount > 0;
}

// Verify user password
export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  // Update last login
  await updateUser(user.id, { last_login: new Date() });

  return user;
}

// Soft delete user (set is_active to false)
export async function deleteUser(id: string): Promise<boolean> {
  const result = await sql`
    UPDATE users 
    SET is_active = false, updated_at = NOW()
    WHERE id = ${id}
  `;

  return result.rowCount > 0;
}

// Get users with pagination
export async function getUsers(params: PaginationParams = {}): Promise<User[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
    FROM users
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows as User[];
}

// Get users with statistics
export async function getUsersWithStats(params: PaginationParams = {}): Promise<UserWithStats[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      u.id, u.email, u.password_hash, u.role, u.company_name, 
      u.created_at, u.updated_at, u.last_login, u.is_active,
      COUNT(DISTINCT d.id) as document_count,
      COUNT(DISTINCT dr.id) as data_rooms_created,
      MAX(al.timestamp) as last_access
    FROM users u
    LEFT JOIN documents d ON u.id = d.uploaded_by
    LEFT JOIN data_rooms dr ON u.id = dr.created_by
    LEFT JOIN access_logs al ON u.id = al.user_id
    WHERE u.is_active = true
    GROUP BY u.id, u.email, u.password_hash, u.role, u.company_name, 
             u.created_at, u.updated_at, u.last_login, u.is_active
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    document_count: parseInt(row.document_count || '0'),
    data_rooms_created: parseInt(row.data_rooms_created || '0')
  })) as UserWithStats[];
}

// Count total active users
export async function getUserCount(): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count FROM users WHERE is_active = true
  `;

  return parseInt(result.rows[0].count);
}

// Get users by role
export async function getUsersByRole(role: UserRole, params: PaginationParams = {}): Promise<User[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT id, email, password_hash, role, company_name, created_at, updated_at, last_login, is_active
    FROM users
    WHERE role = ${role} AND is_active = true
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows as User[];
}