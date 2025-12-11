import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  '/partners': ['Corporate Admin', 'Administrator', 'System Manager', 'Business Coach', 'Territory Admin'],
  '/users': ['Corporate Admin', 'Administrator', 'System Manager', 'Business Coach', 'Territory Admin'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Check for token in cookies or headers
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.headers.get('x-auth-token');

  // For client-side navigation, we should be very permissive
  // The client-side AuthContext will handle authentication checks
  // Check if this is a client-side navigation (not a direct page load)
  const referer = request.headers.get('referer');
  const isClientNavigation = 
    // Has referer from same origin (user clicked a link)
    (referer && referer.startsWith(request.nextUrl.origin)) ||
    // Next.js client-side navigation indicators
    request.headers.get('x-next-router') === 'true' ||
    request.headers.get('x-middleware-rewrite') ||
    // Browser navigation indicators
    request.headers.get('sec-fetch-mode') === 'navigate' ||
    request.headers.get('sec-fetch-site') === 'same-origin';

  // For client-side navigation, always allow the request to proceed
  // The client-side AuthContext will handle authentication and redirects
  if (isClientNavigation) {
    return NextResponse.next();
  }

  // Only redirect to login for direct page loads (not client-side navigation)
  // This happens when user directly types URL or refreshes page
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with token (direct page load), redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based access control is handled client-side in the pages/components
  // because we need to fetch user data from the API
  // The middleware only checks for authentication token presence on direct page loads

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

