/**
 * Route protection: /dashboard and /onboarding require a session cookie.
 * This is an optimistic check (cookie presence); server components and
 * actions verify the session for real via requireSession().
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
