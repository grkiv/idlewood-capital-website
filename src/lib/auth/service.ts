import { sql } from '@vercel/postgres';
import { 
  AuthResponse, 
  AuthUser, 
  LoginRequest,
  AuthError,
  AuthErrorCode,
  AuthAuditLog,
  AuthAuditAction
} from '@/lib/types/auth';
import { User, UserRole } from '@/lib/types/database';
import { verifyPassword, needsRehash, hashPassword } from './password';
import { generateTokenPair, blacklistToken } from './jwt';
import { checkRateLimit, recordAttempt } from './rate-limit';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create authentication error
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  statusCode: number = 401,
  details?: any
): AuthError {
  const error: AuthError = {
    name: 'AuthError',
    message,
    code,
    statusCode,
    details
  };
  return error;
}

/**
 * Log authentication event for security auditing
 */
async function logAuthEvent(
  action: AuthAuditAction,
  ip: string,
  userAgent?: string,
  userId?: string,
  email?: string,
  success: boolean = true,
  errorCode?: AuthErrorCode,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    const logEntry: Omit<AuthAuditLog, 'id' | 'timestamp'> = {
      user_id: userId,
      action,
      ip_address: ip,
      user_agent: userAgent,
      email,
      success,
      error_code: errorCode,
      additional_data: additionalData
    };

    await sql`
      INSERT INTO access_logs (
        id, user_id, action, ip_address, user_agent, timestamp
      ) VALUES (
        ${uuidv4()}, ${userId || null}, ${action}, ${ip}, ${userAgent || null}, NOW()
      )
    `;
  } catch (error) {
    // Log auth events should not fail the main operation
    console.error('Failed to log authentication event:', error);
  }
}

/**
 * Get user by email
 */
async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql<User>`
      SELECT id, email, password_hash, role, company_name, last_login, is_active, created_at, updated_at
      FROM users 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Database error in getUserByEmail:', error);
    throw createAuthError(
      AuthErrorCode.USER_NOT_FOUND,
      'User lookup failed',
      500
    );
  }
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET last_login = NOW(), updated_at = NOW()
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error('Failed to update last login:', error);
    // Don't fail login for this
  }
}

/**
 * Update user's password hash if it needs rehashing
 */
async function updatePasswordHashIfNeeded(userId: string, password: string, currentHash: string): Promise<void> {
  try {
    if (needsRehash(currentHash)) {
      const newHash = await hashPassword(password);
      await sql`
        UPDATE users 
        SET password_hash = ${newHash}, updated_at = NOW()
        WHERE id = ${userId}
      `;
    }
  } catch (error) {
    console.error('Failed to update password hash:', error);
    // Don't fail login for this
  }
}

/**
 * Convert database user to auth user
 */
function mapToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    company_name: user.company_name,
    last_login: user.last_login
  };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  request: LoginRequest,
  ip: string,
  userAgent?: string
): Promise<AuthResponse> {
  const { email, password, remember = false } = request;
  
  // Input validation
  if (!email || !password) {
    await logAuthEvent(AuthAuditAction.LOGIN_FAILURE, ip, userAgent, undefined, email, false, AuthErrorCode.INVALID_CREDENTIALS);
    throw createAuthError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Email and password are required'
    );
  }

  // Check rate limiting
  const rateLimitResult = checkRateLimit(ip, email);
  if (!rateLimitResult.allowed) {
    await logAuthEvent(AuthAuditAction.RATE_LIMIT_TRIGGERED, ip, userAgent, undefined, email, false, AuthErrorCode.RATE_LIMITED);
    
    const resetTime = rateLimitResult.resetTime;
    const resetTimeStr = resetTime ? ` Try again after ${resetTime.toISOString()}` : '';
    
    throw createAuthError(
      AuthErrorCode.RATE_LIMITED,
      `Too many login attempts.${resetTimeStr}`,
      429,
      { resetTime, remaining: rateLimitResult.remaining }
    );
  }

  let user: User | null = null;
  
  try {
    // Get user from database
    user = await getUserByEmail(email);
    
    if (!user) {
      // Record failed attempt
      recordAttempt(ip, false, email);
      await logAuthEvent(AuthAuditAction.LOGIN_FAILURE, ip, userAgent, undefined, email, false, AuthErrorCode.USER_NOT_FOUND);
      
      throw createAuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // Check if user account is active
    if (!user.is_active) {
      recordAttempt(ip, false, email);
      await logAuthEvent(AuthAuditAction.LOGIN_FAILURE, ip, userAgent, user.id, email, false, AuthErrorCode.USER_INACTIVE);
      
      throw createAuthError(
        AuthErrorCode.USER_INACTIVE,
        'Account is inactive. Please contact support.',
        403
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      // Record failed attempt
      recordAttempt(ip, false, email);
      await logAuthEvent(AuthAuditAction.LOGIN_FAILURE, ip, userAgent, user.id, email, false, AuthErrorCode.INVALID_CREDENTIALS);
      
      throw createAuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // Success - record successful attempt
    recordAttempt(ip, true, email);
    
    // Generate token pair
    const { accessToken, refreshToken, jti, expiresAt } = generateTokenPair(
      user.id,
      user.email,
      user.role,
      remember
    );

    // Update last login and rehash password if needed
    await Promise.all([
      updateLastLogin(user.id),
      updatePasswordHashIfNeeded(user.id, password, user.password_hash)
    ]);

    // Log successful login
    await logAuthEvent(
      AuthAuditAction.LOGIN_SUCCESS,
      ip,
      userAgent,
      user.id,
      email,
      true,
      undefined,
      { remember, jti }
    );

    const authUser = mapToAuthUser(user);

    return {
      success: true,
      message: 'Login successful',
      user: authUser,
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };

  } catch (error) {
    // If it's already an AuthError, just rethrow
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    // Log unexpected error
    await logAuthEvent(
      AuthAuditAction.LOGIN_FAILURE,
      ip,
      userAgent,
      user?.id,
      email,
      false,
      AuthErrorCode.INVALID_CREDENTIALS
    );

    console.error('Authentication error:', error);
    throw createAuthError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Authentication failed',
      500
    );
  }
}

/**
 * Logout user and invalidate tokens
 */
export async function logoutUser(
  userId: string,
  jti: string,
  ip: string,
  userAgent?: string
): Promise<void> {
  try {
    // Add refresh token to blacklist
    blacklistToken(jti);
    
    // Log logout event
    await logAuthEvent(
      AuthAuditAction.LOGOUT,
      ip,
      userAgent,
      userId,
      undefined,
      true,
      undefined,
      { jti }
    );
  } catch (error) {
    console.error('Logout error:', error);
    // Don't fail logout even if logging fails
  }
}

/**
 * Get user by ID for token validation
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const result = await sql<User>`
      SELECT id, email, role, company_name, last_login, is_active, created_at
      FROM users 
      WHERE id = ${userId} AND is_active = true
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    return mapToAuthUser(result.rows[0]);
  } catch (error) {
    console.error('Database error in getUserById:', error);
    return null;
  }
}

/**
 * Refresh user tokens
 */
export async function refreshUserTokens(
  userId: string,
  oldJti: string,
  ip: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  try {
    // Get user to ensure they're still active
    const user = await getUserById(userId);
    
    if (!user) {
      await logAuthEvent(AuthAuditAction.TOKEN_REFRESH, ip, userAgent, userId, undefined, false, AuthErrorCode.USER_NOT_FOUND);
      throw createAuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'User not found or inactive'
      );
    }

    // Blacklist old refresh token
    blacklistToken(oldJti);

    // Generate new token pair
    const { accessToken, refreshToken, jti, expiresAt } = generateTokenPair(
      user.id,
      user.email,
      user.role,
      false // Don't extend remember me on refresh
    );

    // Log token refresh
    await logAuthEvent(
      AuthAuditAction.TOKEN_REFRESH,
      ip,
      userAgent,
      userId,
      user.email,
      true,
      undefined,
      { oldJti, newJti: jti }
    );

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };

  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    console.error('Token refresh error:', error);
    throw createAuthError(
      AuthErrorCode.REFRESH_TOKEN_INVALID,
      'Token refresh failed',
      500
    );
  }
}

/**
 * Validate user has required role(s)
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.role === role;
}

/**
 * Validate user has any of the required roles
 */
export function hasAnyRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Validate user has all required roles (for complex permissions)
 */
export function hasAllRoles(user: AuthUser, roles: UserRole[]): boolean {
  // Since we have a simple role system, this is the same as hasRole for single role
  // but could be extended for multi-role systems
  return roles.length === 1 && user.role === roles[0];
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * Check if user is investor
 */
export function isInvestor(user: AuthUser): boolean {
  return user.role === UserRole.INVESTOR;
}