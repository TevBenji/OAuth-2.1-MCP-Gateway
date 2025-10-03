import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/sign-in/(.*)',
    '/sign-up/(.*)',
    '/api/webhook/(.*)',
    '/api/stripe/webhook',
    '/pricing',
    '/features',
    '/docs',
    '/docs/(.*)',
    '/blog',
    '/blog/(.*)',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/compliance',
    '/careers',
    '/api/health',
    '/api/status',
    // Public API routes for documentation
    '/api/public/(.*)',
    // Static files
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/(api|trpc)(.*)',
  ],

  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/webhook/stripe',
    '/((?!api|trpc))(_next.*|.+\\.[\\w]+$)',
  ],

  // Force the user to sign in if they are not authenticated
  // and trying to access a protected route
  beforeAuth: (req) => {
    // Get the URL
    const url = req.nextUrl.clone();

    // Add custom logic here if needed
    // For example, redirect based on user agent, geo-location, etc.

    return NextResponse.next();
  },

  afterAuth(auth, req, evt) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Handle users who are authenticated but don't have an active organization
    if (
      auth.userId &&
      req.nextUrl.pathname.startsWith('/dashboard') &&
      !auth.orgId &&
      req.nextUrl.pathname !== '/dashboard/organization/create'
    ) {
      const orgSelectionUrl = new URL('/dashboard/organization/create', req.url);
      return NextResponse.redirect(orgSelectionUrl);
    }

    // If the user is signed in and trying to access a sign-in or sign-up page,
    // redirect them to the dashboard
    if (
      auth.userId &&
      (req.nextUrl.pathname.startsWith('/sign-in') ||
        req.nextUrl.pathname.startsWith('/sign-up'))
    ) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Check for subscription status for certain routes
    if (auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
      // You can add custom logic here to check subscription status
      // This would typically involve checking user metadata or making an API call

      // Example: Restrict certain features based on plan
      const restrictedRoutes = [
        '/dashboard/organization/api-keys',
        '/dashboard/billing/export',
        '/dashboard/team',
      ];

      // This is a placeholder - you would check actual subscription status
      const hasActiveSubscription = true; // Replace with actual check

      if (restrictedRoutes.includes(req.nextUrl.pathname) && !hasActiveSubscription) {
        const billingUrl = new URL('/dashboard/billing/overview', req.url);
        billingUrl.searchParams.set('upgrade', 'true');
        billingUrl.searchParams.set('feature', req.nextUrl.pathname);
        return NextResponse.redirect(billingUrl);
      }
    }

    // Add custom headers for authenticated requests
    if (auth.userId) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', auth.userId);
      if (auth.orgId) {
        response.headers.set('x-org-id', auth.orgId);
      }
      response.headers.set('x-auth-status', 'authenticated');
      return response;
    }

    return NextResponse.next();
  },

  // Custom sign-in and sign-up URLs
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions (e.g., .png, .jpg, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
