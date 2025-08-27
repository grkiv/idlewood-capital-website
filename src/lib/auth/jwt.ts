import jwt from 'jsonwebtoken';
import { JWTPayload, RefreshTokenPayload, AuthError, AuthErrorCode } from '@/lib/types/auth';
import { UserRole } from '@/lib/types/database';
import { v4 as uuidv4 } from 'uuid';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const JWT_ALGORITHM = 'HS256';

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days
const REMEMBER_ME_REFRESH_EXPIRES_IN = '30d'; // 30 days for remember me

// Validate JWT secrets are configured
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be configured in environment variables');
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

if (JWT_SECRET.length < 32 || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT secrets must be at least 32 characters long');
}

/**
 * Generate access token for authenticated user
 */
export function generateAccessToken(
  userId: string,
  email: string,
  role: UserRole
): string {
  const payload: JWTPayload = {
    sub: userId,
    email,
    role
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'idlewood-capital',
    audience: 'idlewood-portal'
  });
}

/**
 * Generate refresh token for token renewal
 */
export function generateRefreshToken(
  userId: string,
  rememberMe: boolean = false
): { token: string; jti: string } {
  const jti = uuidv4(); // unique token identifier
  
  const payload: RefreshTokenPayload = {
    sub: userId,
    jti
  };

  const expiresIn = rememberMe ? REMEMBER_ME_REFRESH_EXPIRES_IN : REFRESH_TOKEN_EXPIRES_IN;

  const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn,
    issuer: 'idlewood-capital',
    audience: 'idlewood-portal',
    jwtid: jti
  });

  return { token, jti };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: 'idlewood-capital',
      audience: 'idlewood-portal'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Access token has expired',
        code: AuthErrorCode.TOKEN_EXPIRED,
        statusCode: 401
      };
      throw authError;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Invalid access token',
        code: AuthErrorCode.INVALID_TOKEN,
        statusCode: 401
      };
      throw authError;
    }

    throw error;
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: 'idlewood-capital',
      audience: 'idlewood-portal'
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Refresh token has expired',
        code: AuthErrorCode.TOKEN_EXPIRED,
        statusCode: 401
      };
      throw authError;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      const authError: AuthError = {
        name: 'AuthError',
        message: 'Invalid refresh token',
        code: AuthErrorCode.REFRESH_TOKEN_INVALID,
        statusCode: 401
      };
      throw authError;
    }

    throw error;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded.exp) {
      throw new Error('Token does not contain expiration');
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

/**
 * Check if token is expired (with 5 minute buffer)
 */
export function isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
  try {
    const expiration = getTokenExpiration(token);
    const buffer = bufferMinutes * 60 * 1000; // convert to milliseconds
    return Date.now() > (expiration.getTime() - buffer);
  } catch {
    return true; // treat invalid tokens as expired
  }
}

/**
 * Extract user ID from token without verification (for logging)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: UserRole,
  rememberMe: boolean = false
): { accessToken: string; refreshToken: string; jti: string; expiresAt: Date } {
  const accessToken = generateAccessToken(userId, email, role);
  const { token: refreshToken, jti } = generateRefreshToken(userId, rememberMe);
  const expiresAt = getTokenExpiration(accessToken);

  return {
    accessToken,
    refreshToken,
    jti,
    expiresAt
  };
}

/**
 * Constant time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Secure token blacklist interface
 * In production, this should be implemented with Redis or database
 */
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist (for logout)
 */
export function blacklistToken(jti: string): void {
  tokenBlacklist.add(jti);
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(jti: string): boolean {
  return tokenBlacklist.has(jti);
}

/**
 * Clean expired tokens from blacklist (should be run periodically)
 */
export function cleanBlacklist(): void {
  // In a real implementation, this would query the database/Redis
  // to remove expired tokens from the blacklist
  tokenBlacklist.clear();
}

/**
 * Validate JWT configuration on startup
 */
export function validateJWTConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!JWT_SECRET) {
    errors.push('JWT_SECRET environment variable is required');
  }

  if (!JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET environment variable is required');
  }

  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (JWT_SECRET && JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (JWT_REFRESH_SECRET && JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}