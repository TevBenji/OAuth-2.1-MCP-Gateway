import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      // Miniflare options for Cloudflare Workers environment
      modules: true,
      scriptPath: './src/index.ts',
      compatibilityDate: '2024-01-15',
      compatibilityFlags: ['nodejs_compat'],
      kvNamespaces: ['SESSIONS', 'CACHE'],
      d1Databases: ['DB']
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/handlers': path.resolve(__dirname, './src/handlers'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/middleware': path.resolve(__dirname, './src/middleware'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/config': path.resolve(__dirname, './src/config')
    }
  }
});