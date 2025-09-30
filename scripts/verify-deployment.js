#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Comprehensive verification of deployment success
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verification configuration
const verificationConfig = {
  development: {
    timeout: 30000,
    retries: 3,
    requiredEndpoints: ['/health', '/.well-known/oauth-authorization-server'],
    skipSslCheck: true
  },
  staging: {
    timeout: 20000,
    retries: 5,
    requiredEndpoints: [
      '/health',
      '/ready',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource'
    ],
    skipSslCheck: false
  },
  production: {
    timeout: 10000,
    retries: 10,
    requiredEndpoints: [
      '/health',
      '/ready',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource',
      '/oauth/authorize',
      '/oauth/token',
      '/oauth/register'
    ],
    skipSslCheck: false
  }
};

/**
 * Wait for deployment to be ready
 */
async function waitForDeployment(baseUrl, config) {
  console.log(`⏳ Waiting for deployment to be ready at ${baseUrl}...`);
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'OAuth-MCP-Gateway-Verify/1.0'
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ Deployment is ready (attempt ${attempt}/${config.retries})`);
        return { success: true, attempts: attempt };
      }
      
      console.log(`⏳ Deployment not ready yet (attempt ${attempt}/${config.retries}), status: ${response.status}`);
    } catch (error) {
      console.log(`⏳ Deployment not ready yet (attempt ${attempt}/${config.retries}), error: ${error.message}`);
    }
    
    if (attempt < config.retries) {
      const delay = Math.min(1000 * attempt, 10000); // Exponential backoff, max 10s
      console.log(`⏳ Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, attempts: config.retries };
}

/**
 * Verify required endpoints
 */
async function verifyEndpoints(baseUrl, config) {
  console.log(`🔍 Verifying required endpoints...`);
  
  const results = [];
  
  for (const endpoint of config.requiredEndpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: endpoint.includes('/oauth/') && !endpoint.includes('/.well-known/') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OAuth-MCP-Gateway-Verify/1.0'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const success = response.status < 500; // 5xx errors are failures
      
      results.push({
        endpoint,
        status: response.status,
        responseTime,
        success,
        contentType: response.headers.get('content-type')
      });
      
      if (success) {
        console.log(`✅ ${endpoint} - Status: ${response.status}, Time: ${responseTime}ms`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}, Time: ${responseTime}ms`);
      }
    } catch (error) {
      results.push({
        endpoint,
        status: 0,
        responseTime: 0,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`📊 Endpoint verification: ${successCount}/${totalCount} successful`);
  
  return {
    success: successCount === totalCount,
    results,
    successRate: successCount / totalCount
  };
}

/**
 * Verify OAuth discovery metadata
 */
async function verifyOAuthDiscovery(baseUrl) {
  console.log(`🔍 Verifying OAuth discovery metadata...`);
  
  try {
    // Check authorization server metadata
    const authServerResponse = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    if (authServerResponse.status !== 200) {
      throw new Error(`Authorization server metadata returned ${authServerResponse.status}`);
    }
    
    const authServerMetadata = await authServerResponse.json();
    
    // Verify required fields
    const requiredFields = [
      'issuer',
      'authorization_endpoint',
      'token_endpoint',
      'registration_endpoint',
      'code_challenge_methods_supported'
    ];
    
    for (const field of requiredFields) {
      if (!authServerMetadata[field]) {
        throw new Error(`Missing required field in authorization server metadata: ${field}`);
      }
    }
    
    // Verify PKCE support
    if (!authServerMetadata.code_challenge_methods_supported.includes('S256')) {
      throw new Error('S256 PKCE method not supported');
    }
    
    console.log('✅ Authorization server metadata is valid');
    
    // Check protected resource metadata
    const protectedResourceResponse = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
    if (protectedResourceResponse.status !== 200) {
      throw new Error(`Protected resource metadata returned ${protectedResourceResponse.status}`);
    }
    
    const protectedResourceMetadata = await protectedResourceResponse.json();
    
    // Verify required fields
    const requiredResourceFields = ['resource', 'authorization_servers'];
    
    for (const field of requiredResourceFields) {
      if (!protectedResourceMetadata[field]) {
        throw new Error(`Missing required field in protected resource metadata: ${field}`);
      }
    }
    
    console.log('✅ Protected resource metadata is valid');
    
    return {
      success: true,
      authServerMetadata,
      protectedResourceMetadata
    };
  } catch (error) {
    console.log(`❌ OAuth discovery verification failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify security headers
 */
async function verifySecurityHeaders(baseUrl) {
  console.log(`🔒 Verifying security headers...`);
  
  try {
    const response = await fetch(`${baseUrl}/health`);
    
    const requiredHeaders = {
      'strict-transport-security': 'HSTS header',
      'x-content-type-options': 'Content type options header',
      'x-frame-options': 'Frame options header',
      'x-xss-protection': 'XSS protection header'
    };
    
    const results = [];
    
    for (const [header, description] of Object.entries(requiredHeaders)) {
      const value = response.headers.get(header);
      const present = !!value;
      
      results.push({
        header,
        description,
        present,
        value
      });
      
      if (present) {
        console.log(`✅ ${description}: ${value}`);
      } else {
        console.log(`⚠️  ${description}: Missing`);
      }
    }
    
    const presentCount = results.filter(r => r.present).length;
    const totalCount = results.length;
    
    return {
      success: presentCount >= totalCount * 0.75, // At least 75% of headers should be present
      results,
      score: presentCount / totalCount
    };
  } catch (error) {
    console.log(`❌ Security headers verification failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify performance requirements
 */
async function verifyPerformance(baseUrl, config) {
  console.log(`⚡ Verifying performance requirements...`);
  
  const performanceTests = [
    { name: 'Health Check', endpoint: '/health', maxTime: 1000 },
    { name: 'OAuth Discovery', endpoint: '/.well-known/oauth-authorization-server', maxTime: 2000 }
  ];
  
  const results = [];
  
  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${test.endpoint}`);
      const responseTime = Date.now() - startTime;
      
      const success = response.status === 200 && responseTime <= test.maxTime;
      
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        responseTime,
        maxTime: test.maxTime,
        success
      });
      
      if (success) {
        console.log(`✅ ${test.name}: ${responseTime}ms (max: ${test.maxTime}ms)`);
      } else {
        console.log(`❌ ${test.name}: ${responseTime}ms (max: ${test.maxTime}ms) - ${response.status}`);
      }
    } catch (error) {
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        responseTime: 0,
        maxTime: test.maxTime,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  return {
    success: successCount === totalCount,
    results,
    successRate: successCount / totalCount
  };
}

/**
 * Run comprehensive deployment verification
 */
async function verifyDeployment(environment, baseUrl) {
  console.log(`🚀 Starting deployment verification for ${environment} at ${baseUrl}`);
  
  const config = verificationConfig[environment];
  const verificationResults = {
    environment,
    baseUrl,
    timestamp: new Date().toISOString(),
    overall: { success: false, score: 0 }
  };
  
  try {
    // Step 1: Wait for deployment to be ready
    console.log('\n📋 Step 1: Waiting for deployment readiness');
    const readinessResult = await waitForDeployment(baseUrl, config);
    verificationResults.readiness = readinessResult;
    
    if (!readinessResult.success) {
      throw new Error('Deployment is not ready after maximum retries');
    }
    
    // Step 2: Verify required endpoints
    console.log('\n📋 Step 2: Verifying required endpoints');
    const endpointsResult = await verifyEndpoints(baseUrl, config);
    verificationResults.endpoints = endpointsResult;
    
    // Step 3: Verify OAuth discovery
    console.log('\n📋 Step 3: Verifying OAuth discovery metadata');
    const oauthResult = await verifyOAuthDiscovery(baseUrl);
    verificationResults.oauth = oauthResult;
    
    // Step 4: Verify security headers
    console.log('\n📋 Step 4: Verifying security headers');
    const securityResult = await verifySecurityHeaders(baseUrl);
    verificationResults.security = securityResult;
    
    // Step 5: Verify performance
    console.log('\n📋 Step 5: Verifying performance requirements');
    const performanceResult = await verifyPerformance(baseUrl, config);
    verificationResults.performance = performanceResult;
    
    // Calculate overall score
    const scores = [
      readinessResult.success ? 1 : 0,
      endpointsResult.successRate,
      oauthResult.success ? 1 : 0,
      securityResult.score,
      performanceResult.successRate
    ];
    
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const overallSuccess = overallScore >= 0.8; // 80% threshold
    
    verificationResults.overall = {
      success: overallSuccess,
      score: overallScore
    };
    
    // Save verification report
    const reportDir = path.join(__dirname, '..', 'verification-reports');
    fs.mkdirSync(reportDir, { recursive: true });
    
    const reportFile = path.join(reportDir, `${environment}-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(verificationResults, null, 2));
    
    console.log(`\n📄 Verification report saved: ${reportFile}`);
    
    // Summary
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log(`Overall Score: ${(overallScore * 100).toFixed(1)}%`);
    console.log(`Overall Status: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 Deployment verification completed successfully!');
    } else {
      console.log('\n⚠️  Deployment verification failed. Please check the issues above.');
    }
    
    return verificationResults;
  } catch (error) {
    console.error(`\n❌ Deployment verification failed: ${error.message}`);
    verificationResults.error = error.message;
    return verificationResults;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  
  // Get base URL for environment
  const baseUrls = {
    development: process.env.DEVELOPMENT_GATEWAY_URL || 'https://dev.oauth-mcp-gateway.example.com',
    staging: process.env.STAGING_GATEWAY_URL || 'https://staging.oauth-mcp-gateway.example.com',
    production: process.env.PRODUCTION_GATEWAY_URL || 'https://oauth-mcp-gateway.example.com'
  };
  
  const baseUrl = baseUrls[environment];
  
  if (!baseUrl) {
    console.error(`❌ Unknown environment: ${environment}`);
    process.exit(1);
  }
  
  const result = await verifyDeployment(environment, baseUrl);
  
  if (!result.overall.success) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  verifyDeployment,
  waitForDeployment,
  verifyEndpoints,
  verifyOAuthDiscovery,
  verifySecurityHeaders,
  verifyPerformance,
  verificationConfig
};