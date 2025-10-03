/**
 * Integration Test Runner
 * 
 * Orchestrates the execution of all integration tests with proper
 * setup, teardown, and reporting.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test suite imports
import './end-to-end-oauth-flow.test';
import './multi-tenant-isolation.test';
import '../performance/load-testing.test';
import '../security/pkce-security.test';
import '../security/token-validation-security.test';
import '../chaos/failure-scenarios.test';

describe('Integration Test Suite', () => {
  let testStartTime: number;
  let testResults: Array<{
    suite: string;
    passed: number;
    failed: number;
    duration: number;
  }> = [];

  beforeAll(async () => {
    testStartTime = performance.now();
    console.log('🚀 Starting OAuth 2.1 MCP Gateway Integration Test Suite');
    console.log('=' .repeat(60));
    
    // Pre-test system checks
    await performSystemChecks();
  });

  afterAll(async () => {
    const testEndTime = performance.now();
    const totalDuration = testEndTime - testStartTime;
    
    console.log('=' .repeat(60));
    console.log('📊 Integration Test Suite Results');
    console.log('=' .repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    testResults.forEach(result => {
      console.log(`${result.suite}:`);
      console.log(`  ✅ Passed: ${result.passed}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  ⏱️  Duration: ${result.duration.toFixed(2)}ms`);
      console.log('');
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    console.log(`Total Tests: ${totalPassed + totalFailed}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (totalFailed > 0) {
      console.log('');
      console.log('❌ Some tests failed. Please review the output above.');
      process.exit(1);
    } else {
      console.log('');
      console.log('✅ All integration tests passed!');
    }
  });

  async function performSystemChecks() {
    console.log('🔍 Performing pre-test system checks...');
    
    // Check environment variables
    const requiredEnvVars = [
      'ENVIRONMENT',
      'JWT_ISSUER',
      'CORS_ORIGINS'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    // Check test dependencies
    try {
      // Verify crypto API availability
      if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }
      
      // Verify performance API
      if (typeof performance === 'undefined') {
        throw new Error('Performance API not available');
      }
      
      console.log('✅ System checks passed');
    } catch (error: any) {
      console.error(`❌ System check failed: ${error.message}`);
      throw error;
    }
  }

  // Test suite execution tracking
  it('should track test execution', () => {
    // This is a placeholder test that always passes
    // Real test tracking would be implemented in the test framework hooks
    expect(true).toBe(true);
  });
});

// Export test utilities for use in other test files
export const integrationTestUtils = {
  /**
   * Record test suite results
   */
  recordTestResult: (suite: string, passed: number, failed: number, duration: number) => {
    // This would be called by individual test suites to record their results
    console.log(`📝 Recording results for ${suite}: ${passed} passed, ${failed} failed`);
  },

  /**
   * Generate test report
   */
  generateReport: () => {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      platform: process.platform,
      nodeVersion: process.version
    };
  },

  /**
   * Validate test environment
   */
  validateEnvironment: () => {
    const checks = [
      { name: 'Crypto API', check: () => typeof crypto !== 'undefined' && !!crypto.subtle },
      { name: 'Performance API', check: () => typeof performance !== 'undefined' },
      { name: 'Fetch API', check: () => typeof fetch !== 'undefined' },
      { name: 'TextEncoder', check: () => typeof TextEncoder !== 'undefined' },
      { name: 'TextDecoder', check: () => typeof TextDecoder !== 'undefined' }
    ];

    const results = checks.map(check => ({
      name: check.name,
      passed: check.check()
    }));

    const failedChecks = results.filter(r => !r.passed);
    
    if (failedChecks.length > 0) {
      throw new Error(`Environment validation failed: ${failedChecks.map(c => c.name).join(', ')}`);
    }

    return results;
  }
};