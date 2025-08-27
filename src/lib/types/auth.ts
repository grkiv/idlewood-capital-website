import { UserRole } from './database';

// JWT payload structure
export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for refresh token tracking
}

// Refresh token payload structure
export interface RefreshTokenPayload {
  sub: string; // user id
  jti: string; // unique token identifier
  iat?: number;
  exp?: number;
}

// Authentication response types
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  company_name?: string;
  last_login?: Date;
}

// Login request types
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse extends AuthResponse {
  expiresAt?: string;
}

// Session types
export interface SessionData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Password validation types
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Rate limiting types
export interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

export interface RateLimitAttempt {
  ip: string;
  email?: string;
  timestamp: Date;
  success: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
  blocked: boolean;
}

// Authentication error types
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
}

export interface AuthError extends Error {
  code: AuthErrorCode;
  statusCode: number;
  details?: any;
}

// Route protection types
export interface RoutePermission {
  roles: UserRole[];
  requireAll?: boolean; // if true, user must have ALL roles, if false, ANY role
}

export interface ProtectedRouteConfig {
  path: string;
  permission: RoutePermission;
  redirectTo?: string;
}

// Audit log types for authentication events
export interface AuthAuditLog {
  id: string;
  user_id?: string;
  action: AuthAuditAction;
  ip_address?: string;
  user_agent?: string;
  email?: string;
  success: boolean;
  error_code?: AuthErrorCode;
  additional_data?: Record<string, any>;
  timestamp: Date;
}

export enum AuthAuditAction {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REVOKE = 'token_revoke',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  RATE_LIMIT_TRIGGERED = 'rate_limit_triggered'
}

// Token storage types (for client-side)
export interface TokenStorage {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
}

// Authentication context types
export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
}

// Middleware types
export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  roles?: UserRole[];
  requireAll?: boolean;
  redirectTo?: string;
  apiResponse?: boolean; // if true, returns JSON error instead of redirect
}

export interface AuthMiddlewareResult {
  authenticated: boolean;
  authorized: boolean;
  user?: AuthUser;
  error?: {
    code: AuthErrorCode;
    message: string;
    statusCode: number;
  };
}