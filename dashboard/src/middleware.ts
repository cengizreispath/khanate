import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const KHANATE_TOKEN = process.env.KHANATE_TOKEN || 'khanate-secret-2026';

// Paths that don't require auth
const publicPaths = ['/login', '/api/health', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Allow static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check for auth cookie
  const authCookie = request.cookies.get('khanate-auth');
  
  // API requests - check Bearer token or cookie
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader === `Bearer ${KHANATE_TOKEN}` || authCookie?.value === KHANATE_TOKEN) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Page requests - redirect to login if not authenticated
  if (authCookie?.value !== KHANATE_TOKEN) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
