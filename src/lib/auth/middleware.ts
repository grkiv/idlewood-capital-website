import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, isTokenExpired } from './jwt';
import { getUserById } from './service';
import { 
  AuthMiddlewareConfig, 
  AuthMiddlewareResult, 
  AuthUser, 
  AuthErrorCode 
} from '@/lib/types/auth';
import { UserRole } from '@/lib/types/database';

/**
 * Extract access token from request (cookie or Authorization header)
 */
function extractAccessToken(request: NextRequest): string | null {
  // First, try to get from cookie (preferred for security)
  const tokenFromCookie = request.cookies.get('accessToken')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Create authentication middleware result
 */
function createMiddlewareResult(
  authenticated: boolean,
  authorized: boolean,
  user?: AuthUser,
  errorCode?: AuthErrorCode,
  errorMessage?: string,
  statusCode?: number
): AuthMiddlewareResult {
  const result: AuthMiddlewareResult = {
    authenticated,
    authorized,
    user
  };

  if (errorCode && errorMessage) {
    result.error = {
      code: errorCode,
      message: errorMessage,
      statusCode: statusCode || 401
    };
  }

  return result;
}

/**
 * Validate user has required roles
 */
function validateRoles(user: AuthUser, roles: UserRole[], requireAll: boolean = false): boolean {
  if (!roles || roles.length === 0) {
    return true; // No role requirements
  }

  if (requireAll) {
    // User must have ALL specified roles (for single role system, only works with one role)
    return roles.length === 1 && roles.includes(user.role);
  } else {
    // User must have ANY of the specified roles
    return roles.includes(user.role);
  }
}

/**
 * Main authentication middleware function
 */
export async function authMiddleware(
  request: NextRequest,
  config: AuthMiddlewareConfig = {}
): Promise<AuthMiddlewareResult> {
  const {
    requireAuth = true,
    roles = [],
    requireAll = false
  } = config;

  // If auth is not required, skip validation
  if (!requireAuth) {
    return createMiddlewareResult(false, true);
  }

  // Extract access token
  const accessToken = extractAccessToken(request);
  
  if (!accessToken) {
    return createMiddlewareResult(
      false,
      false,
      undefined,
      AuthErrorCode.INVALID_TOKEN,
      'Access token not found',
      401
    );
  }

  // Check if token is expired (with buffer)
  if (isTokenExpired(accessToken)) {
    return createMiddlewareResult(
      false,
      false,
      undefined,
      AuthErrorCode.TOKEN_EXPIRED,
      'Access token has expired',
      401
    );
  }

  // Verify access token
  let payload;
  try {
    payload = verifyAccessToken(accessToken);
  } catch (error: any) {
    return createMiddlewareResult(
      false,
      false,
      undefined,
      error.code || AuthErrorCode.INVALID_TOKEN,
      error.message || 'Invalid access token',
      401
    );
  }

  // Get user from database to ensure they're still active
  const user = await getUserById(payload.sub);
  
  if (!user) {
    return createMiddlewareResult(
      false,
      false,
      undefined,
      AuthErrorCode.USER_NOT_FOUND,
      'User not found or inactive',
      401
    );
  }

  // Validate user roles
  const hasRequiredRoles = validateRoles(user, roles, requireAll);
  
  if (!hasRequiredRoles) {
    return createMiddlewareResult(
      true,
      false,
      user,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions',
      403
    );
  }

  // Success - user is authenticated and authorized
  return createMiddlewareResult(true, true, user);
}

/**
 * Create a Next.js middleware response for authentication
 */
export function createAuthMiddlewareResponse(
  result: AuthMiddlewareResult,
  config: AuthMiddlewareConfig = {}
): NextResponse | null {
  const { redirectTo = '/investor-portal', apiResponse = false } = config;

  // If authenticated and authorized, continue
  if (result.authenticated && result.authorized) {
    return null; // Continue to the route
  }

  // Handle API responses
  if (apiResponse || result.error) {
    const statusCode = result.error?.statusCode || 401;
    const message = result.error?.message || 'Authentication required';
    const code = result.error?.code || AuthErrorCode.INVALID_TOKEN;

    return NextResponse.json(
      {
        success: false,
        message,
        code
      },
      { status: statusCode }
    );
  }

  // Handle redirect responses
  const url = new URL(redirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000');
  return NextResponse.redirect(url);
}

/**
 * Higher-order function to create route protection middleware
 */
export function withAuth(
  config: AuthMiddlewareConfig = {}
) {
  return async function(request: NextRequest) {
    const result = await authMiddleware(request, config);
    return createAuthMiddlewareResponse(result, config);
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = withAuth({
  requireAuth: true,
  roles: [UserRole.ADMIN],
  redirectTo: '/investor-portal'
});

/**
 * Investor or Admin middleware
 */
export const requireInvestorOrAdmin = withAuth({
  requireAuth: true,
  roles: [UserRole.INVESTOR, UserRole.ADMIN],
  redirectTo: '/investor-portal'
});

/**
 * API endpoint protection middleware
 */
export const requireApiAuth = withAuth({
  requireAuth: true,
  apiResponse: true
});

/**
 * Admin API endpoint protection middleware
 */
export const requireAdminApi = withAuth({
  requireAuth: true,
  roles: [UserRole.ADMIN],
  apiResponse: true
});

/**
 * Investor or Admin API endpoint protection middleware
 */
export const requireInvestorApi = withAuth({
  requireAuth: true,
  roles: [UserRole.INVESTOR, UserRole.ADMIN],
  apiResponse: true
});

/**
 * Extract user from authenticated request
 * Use this in API routes after middleware validation
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const result = await authMiddleware(request);
  return result.user || null;
}

/**
 * Check if request is authenticated
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const result = await authMiddleware(request, { requireAuth: true });
  return result.authenticated;
}

/**
 * Check if user has specific role
 */
export async function hasRole(request: NextRequest, role: UserRole): Promise<boolean> {
  const result = await authMiddleware(request, { 
    requireAuth: true, 
    roles: [role] 
  });
  return result.authenticated && result.authorized;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(request: NextRequest, roles: UserRole[]): Promise<boolean> {
  const result = await authMiddleware(request, { 
    requireAuth: true, 
    roles,
    requireAll: false 
  });
  return result.authenticated && result.authorized;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  return hasRole(request, UserRole.ADMIN);
}

/**
 * Check if user is investor
 */
export async function isInvestor(request: NextRequest): Promise<boolean> {
  return hasRole(request, UserRole.INVESTOR);
}