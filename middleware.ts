import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, createAuthMiddlewareResponse } from '@/lib/auth/middleware';
import { UserRole } from '@/lib/types/database';

/**
 * Define protected routes and their access requirements
 */
const protectedRoutes = [
  {
    path: '/dashboard',
    roles: [UserRole.INVESTOR, UserRole.ADMIN],
    redirectTo: '/investor-portal'
  },
  {
    path: '/admin',
    roles: [UserRole.ADMIN],
    redirectTo: '/investor-portal'
  },
  {
    path: '/api/admin',
    roles: [UserRole.ADMIN],
    apiResponse: true
  },
  {
    path: '/api/investor',
    roles: [UserRole.INVESTOR, UserRole.ADMIN],
    apiResponse: true
  },
  {
    path: '/api/protected',
    roles: [UserRole.INVESTOR, UserRole.ADMIN],
    apiResponse: true
  }
];

/**
 * Check if path matches a protected route
 */
function getProtectedRoute(pathname: string) {
  return protectedRoutes.find(route => 
    pathname.startsWith(route.path)
  );
}

/**
 * Check if path is an auth endpoint (skip auth for these)
 */
function isAuthEndpoint(pathname: string): boolean {
  const authEndpoints = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/investor-portal' // login page
  ];
  
  return authEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/api/contact',
    '/_next',
    '/favicon.ico',
    '/assets',
    '/public'
  ];
  
  return publicPaths.some(path => pathname.startsWith(path));
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Skip middleware for auth endpoints
  if (isAuthEndpoint(pathname)) {
    return NextResponse.next();
  }
  
  // Check if this is a protected route
  const protectedRoute = getProtectedRoute(pathname);
  
  if (!protectedRoute) {
    // Not a protected route, allow access
    return NextResponse.next();
  }
  
  // Run authentication middleware
  const authResult = await authMiddleware(request, {
    requireAuth: true,
    roles: protectedRoute.roles,
    requireAll: false
  });
  
  // Create response based on auth result
  const authResponse = createAuthMiddlewareResponse(authResult, {
    redirectTo: protectedRoute.redirectTo,
    apiResponse: protectedRoute.apiResponse
  });
  
  // If auth response is null, continue to the route
  if (!authResponse) {
    // Add user info to request headers for downstream use
    if (authResult.user) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', authResult.user.id);
      requestHeaders.set('x-user-email', authResult.user.email);
      requestHeaders.set('x-user-role', authResult.user.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    
    return NextResponse.next();
  }
  
  return authResponse;
}

/**
 * Configure which paths should run the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};