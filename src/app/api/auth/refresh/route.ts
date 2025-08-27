import { NextRequest, NextResponse } from 'next/server';
import { refreshUserTokens } from '@/lib/auth/service';
import { verifyRefreshToken, isTokenBlacklisted } from '@/lib/auth/jwt';
import { AuthErrorCode } from '@/lib/types/auth';

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return request.ip || '127.0.0.1';
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown';
}

/**
 * Create error response
 */
function createErrorResponse(
  message: string,
  statusCode: number = 400,
  code?: AuthErrorCode
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code
    },
    { status: statusCode }
  );
}

/**
 * Set secure HTTP-only cookies for new tokens
 */
function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string, expiresAt: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN;
  
  // Access token cookie
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    domain: domain,
    expires: new Date(expiresAt)
  });

  // Refresh token cookie (7 days)
  const refreshExpires = new Date();
  refreshExpires.setDate(refreshExpires.getDate() + 7);

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    domain: domain,
    expires: refreshExpires
  });
}

/**
 * Handle POST request for token refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return createErrorResponse(
        'Refresh token not found',
        401,
        AuthErrorCode.REFRESH_TOKEN_INVALID
      );
    }

    // Get request metadata
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      return createErrorResponse(
        error.message || 'Invalid refresh token',
        401,
        error.code || AuthErrorCode.REFRESH_TOKEN_INVALID
      );
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(payload.jti)) {
      return createErrorResponse(
        'Refresh token has been revoked',
        401,
        AuthErrorCode.REFRESH_TOKEN_INVALID
      );
    }

    // Refresh tokens
    const newTokens = await refreshUserTokens(
      payload.sub,
      payload.jti,
      ip,
      userAgent
    );

    // Create success response
    const response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      expiresAt: newTokens.expiresAt
    });

    // Set new secure cookies
    setAuthCookies(response, newTokens.accessToken, newTokens.refreshToken, newTokens.expiresAt);

    return response;

  } catch (error: any) {
    console.error('Token refresh API error:', error);

    // Handle authentication errors
    if (error.code && error.statusCode) {
      return createErrorResponse(error.message, error.statusCode, error.code);
    }

    // Handle other errors
    return createErrorResponse(
      'Token refresh failed',
      500,
      AuthErrorCode.REFRESH_TOKEN_INVALID
    );
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * Reject non-POST requests
 */
export async function GET() {
  return createErrorResponse('Method not allowed', 405);
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405);
}

export async function PATCH() {
  return createErrorResponse('Method not allowed', 405);
}