import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth/service';
import { verifyRefreshToken, extractUserIdFromToken } from '@/lib/auth/jwt';
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
 * Clear authentication cookies
 */
function clearAuthCookies(response: NextResponse) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN;
  
  // Clear access token cookie
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    domain: domain,
    expires: new Date(0)
  });

  // Clear refresh token cookie
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    domain: domain,
    expires: new Date(0)
  });
}

/**
 * Handle POST request for user logout
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    // Get request metadata
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    let userId: string | null = null;
    let jti: string | null = null;

    // If we have a refresh token, validate it and get user info
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        userId = payload.sub;
        jti = payload.jti;
      } catch (error) {
        // Token might be invalid or expired, but we can still log out
        // Try to extract user ID without verification for logging
        userId = extractUserIdFromToken(refreshToken);
      }
    }

    // Perform logout (invalidate tokens)
    if (userId && jti) {
      await logoutUser(userId, jti, ip, userAgent);
    }

    // Create success response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear authentication cookies
    clearAuthCookies(response);

    return response;

  } catch (error: any) {
    console.error('Logout API error:', error);

    // Even if logout fails, clear cookies and return success
    // This ensures the user is logged out from the client side
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    clearAuthCookies(response);
    return response;
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