/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Typed routes (moved out of experimental in Next.js 15)
  typedRoutes: true,

  // Transpile workspace packages
  transpilePackages: ['@oauth-mcp-gateway/db'],

  images: {
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
                ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:;"
                : '',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: `${process.env.GATEWAY_URL || 'http://localhost:8787'}/:path*`,
      },
    ];
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'OAuth 2.1 MCP Gateway',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Secure OAuth 2.1 authentication gateway for MCP servers',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // @oauth-mcp-gateway/db uses NodeNext-style `./x.js` imports for `.ts` sources
  webpack: config => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
};

module.exports = nextConfig;
