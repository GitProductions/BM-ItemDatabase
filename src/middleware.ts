import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {

  // Watching auth + item submission routes to capture client IP for logging to prevent possible abuses
  const { pathname } = request.nextUrl;
  if (
    !pathname.startsWith('/api/auth/register') &&
    pathname !== '/api/auth' &&
    !pathname.startsWith('/api/items')
  ) {
    return NextResponse.next();
  }

  // Derive best-effort client IP from common proxy headers
  const header = (name: string) => request.headers.get(name);
  const ip =
    // header('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    header('cf-connecting-ip') ||
    header('x-forwarded-for')?.split(',')[0].trim() ||
    header('x-real-ip') ||
    '127.0.0.1';


  // Pass through all headers plus a normalized ip header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-real-ip', ip);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // expose for quick verification in dev tools/curl
  // response.headers.set('x-debug-ip', ip);

  return response;
}

export const config = {
  matcher: ['/api/auth/:path*', '/api/items/:path*'],
};
