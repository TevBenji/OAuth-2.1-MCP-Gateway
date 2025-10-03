import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/features',
  '/docs(.*)',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/security',
  '/compliance',
  '/careers',
  '/api/health',
  '/api/status',
  '/api/webhook/(.*)',
  '/api/stripe/webhook',
  '/api/public/(.*)',
]);

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/protected(.*)',
  '/onboarding(.*)',
  '/settings(.*)',
]);

// Define routes that require organization selection
const requiresOrganization = createRouteMatcher([
  '/dashboard/organization(.*)',
  '/dashboard/team(.*)',
  '/dashboard/billing(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  // For users visiting protected routes
  if (isProtectedRoute(req)) {
    // If they're not signed in, redirect to sign in
    if (!userId) {
      const authObj = await auth();
      return authObj.redirectToSignIn({ returnBackUrl: req.url });
    }

    // Check if organization is required for certain routes
    if (requiresOrganization(req) && !orgId) {
      const orgSelectionUrl = new URL('/dashboard', req.url);
      orgSelectionUrl.searchParams.set('select-org', 'true');
      return NextResponse.redirect(orgSelectionUrl);
    }

    // Check subscription status for certain features
    const restrictedFeatures = [
      '/dashboard/organization/api-keys',
      '/dashboard/billing/export',
      '/dashboard/team',
    ];

    // Check if the current path requires a paid subscription
    const requiresSubscription = restrictedFeatures.some(path => pathname.startsWith(path));

    if (requiresSubscription) {
      // This is a placeholder - in production, you would check actual subscription status
      // from user metadata or database
      const hasActiveSubscription = sessionClaims?.subscription?.status === 'active' || true; // Default to true for development

      if (!hasActiveSubscription) {
        const billingUrl = new URL('/dashboard/billing/overview', req.url);
        billingUrl.searchParams.set('upgrade', 'true');
        billingUrl.searchParams.set('feature', pathname);
        return NextResponse.redirect(billingUrl);
      }
    }
  }

  // For users visiting public routes
  if (isPublicRoute(req)) {
    // If they're signed in and trying to access auth pages, redirect to dashboard
    if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // For API routes, add custom headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    if (userId) {
      response.headers.set('x-user-id', userId);
      if (orgId) {
        response.headers.set('x-org-id', orgId);
      }
      response.headers.set('x-auth-status', 'authenticated');
    }

    return response;
  }

  // Default behavior for other routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
