/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable experimental features (Next.js 15 compatible)
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Typed routes (moved out of experimental in Next.js 15)
  typedRoutes: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'production'
                ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.com *.clerk.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' *.clerk.com; img-src 'self' blob: data: *.clerk.com *.gravatar.com *.googleusercontent.com *.githubusercontent.com; font-src 'self' data:; connect-src 'self' *.clerk.com *.clerk.dev wss://*.clerk.com api.stripe.com; frame-src 'self' *.clerk.com *.stripe.com; worker-src 'self' blob:;"
                : '',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/api-docs',
        destination: '/docs/api',
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: `${process.env.NEXT_PUBLIC_MCP_GATEWAY_URL || 'http://localhost:8787'}/:path*`,
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'OAuth 2.1 MCP Gateway',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Secure OAuth 2.1 authentication gateway for MCP servers',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Ignore certain warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@clerk/ },
      { module: /node_modules\/punycode/ },
    ];

    // Add fallbacks for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Output configuration
  output: 'standalone',

  // Disable powered by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Trailing slash
  trailingSlash: false,
};

module.exports = nextConfig;
