import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth/service';
import { AuthErrorCode } from '@/lib/types/auth';
import { headers } from 'next/headers';

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (from reverse proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection IP
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
 * Set secure HTTP-only cookies for tokens
 */
function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string, expiresAt: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN;
  
  // Access token cookie (shorter expiration)
  response.cookies.set('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    domain: domain,
    expires: new Date(expiresAt)
  });

  // Refresh token cookie (longer expiration)
  const refreshExpires = new Date();
  refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days

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
 * Handle POST request for user login
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request structure
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request body', 400);
    }

    const { email, password, remember } = body;

    // Basic input validation
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400, AuthErrorCode.INVALID_CREDENTIALS);
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return createErrorResponse('Email and password must be strings', 400, AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400, AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Get request metadata
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Authenticate user
    const authResult = await authenticateUser(
      { email, password, remember },
      ip,
      userAgent
    );

    // Create success response
    const response = NextResponse.json({
      success: true,
      message: authResult.message,
      user: authResult.user,
      expiresAt: authResult.expiresAt
    });

    // Set secure cookies
    if (authResult.accessToken && authResult.refreshToken && authResult.expiresAt) {
      setAuthCookies(response, authResult.accessToken, authResult.refreshToken, authResult.expiresAt);
    }

    return response;

  } catch (error: any) {
    console.error('Login API error:', error);

    // Handle authentication errors
    if (error.code && error.statusCode) {
      return createErrorResponse(error.message, error.statusCode, error.code);
    }

    // Handle other errors
    return createErrorResponse(
      'An unexpected error occurred during login',
      500,
      AuthErrorCode.INVALID_CREDENTIALS
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