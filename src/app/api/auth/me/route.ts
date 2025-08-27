import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { AuthErrorCode } from '@/lib/types/auth';

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
 * Handle GET request to get current user info
 */
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const user = await getCurrentUser(request);
    
    if (!user) {
      return createErrorResponse(
        'Authentication required',
        401,
        AuthErrorCode.INVALID_TOKEN
      );
    }

    // Return user information
    return NextResponse.json({
      success: true,
      message: 'User information retrieved successfully',
      user
    });

  } catch (error: any) {
    console.error('Get current user error:', error);

    // Handle authentication errors
    if (error.code && error.statusCode) {
      return createErrorResponse(error.message, error.statusCode, error.code);
    }

    // Handle other errors
    return createErrorResponse(
      'Failed to get user information',
      500
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * Reject non-GET requests
 */
export async function POST() {
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