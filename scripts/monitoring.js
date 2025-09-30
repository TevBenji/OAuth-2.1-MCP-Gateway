#!/usr/bin/env node

/**
 * Monitoring and Alerting Script
 * Manages monitoring setup and health checks for the OAuth 2.1 MCP Gateway
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Monitoring configuration
const monitoringConfig = {
  development: {
    healthCheckInterval: 60000, // 1 minute
    alertThresholds: {
      responseTime: 2000, // 2 seconds
      errorRate: 0.1, // 10%
      availability: 0.95 // 95%
    }
  },
  staging: {
    healthCheckInterval: 30000, // 30 seconds
    alertThresholds: {
      responseTime: 1000, // 1 second
      errorRate: 0.05, // 5%
      availability: 0.98 // 98%
    }
  },
  production: {
    healthCheckInterval: 15000, // 15 seconds
    alertThresholds: {
      responseTime: 500, // 500ms
      errorRate: 0.01, // 1%
      availability: 0.999 // 99.9%
    }
  }
};

/**
 * Health check function
 */
async function performHealthCheck(baseUrl) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'OAuth-MCP-Gateway-Monitor/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    const isHealthy = response.status === 200;
    
    let healthData = null;
    try {
      healthData = await response.json();
    } catch (error) {
      // Ignore JSON parsing errors for health check
    }
    
    return {
      success: true,
      healthy: isHealthy,
      responseTime,
      status: response.status,
      data: healthData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      healthy: false,
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * OAuth endpoints health check
 */
async function checkOAuthEndpoints(baseUrl) {
  const endpoints = [
    '/.well-known/oauth-authorization-server',
    '/.well-known/oauth-protected-resource',
    '/oauth/authorize',
    '/oauth/token',
    '/oauth/register'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: endpoint.includes('/oauth/') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint,
        status: response.status,
        responseTime,
        healthy: response.status < 500, // 5xx errors are unhealthy
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint,
        status: 0,
        responseTime,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}

/**
 * Performance monitoring
 */
async function monitorPerformance(baseUrl, duration = 60000) {
  console.log(`🔍 Monitoring performance for ${duration / 1000} seconds...`);
  
  const results = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    const healthCheck = await performHealthCheck(baseUrl);
    results.push(healthCheck);
    
    // Wait 5 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Calculate metrics
  const totalChecks = results.length;
  const successfulChecks = results.filter(r => r.success && r.healthy).length;
  const availability = successfulChecks / totalChecks;
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
  
  const metrics = {
    totalChecks,
    successfulChecks,
    availability,
    avgResponseTime,
    maxResponseTime: Math.max(...results.filter(r => r.success).map(r => r.responseTime)),
    minResponseTime: Math.min(...results.filter(r => r.success).map(r => r.responseTime)),
    errorRate: (totalChecks - successfulChecks) / totalChecks,
    duration: duration / 1000
  };
  
  console.log('📊 Performance Metrics:');
  console.log(`Availability: ${(availability * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
  
  return metrics;
}

/**
 * Load testing
 */
async function performLoadTest(baseUrl, options = {}) {
  const {
    concurrency = 10,
    duration = 30000,
    endpoint = '/health'
  } = options;
  
  console.log(`🚀 Performing load test: ${concurrency} concurrent requests for ${duration / 1000} seconds`);
  
  const results = [];
  const startTime = Date.now();
  
  // Function to make a single request
  const makeRequest = async () => {
    const requestStart = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const responseTime = Date.now() - requestStart;
      
      return {
        success: true,
        status: response.status,
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      
      return {
        success: false,
        error: error.message,
        responseTime,
        timestamp: Date.now()
      };
    }
  };
  
  // Run concurrent requests
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push((async () => {
      const workerResults = [];
      
      while (Date.now() - startTime < duration) {
        const result = await makeRequest();
        workerResults.push(result);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return workerResults;
    })());
  }
  
  const allResults = await Promise.all(workers);
  const flatResults = allResults.flat();
  
  // Calculate load test metrics
  const totalRequests = flatResults.length;
  const successfulRequests = flatResults.filter(r => r.success && r.status === 200).length;
  const avgResponseTime = flatResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / flatResults.filter(r => r.success).length;
  
  const loadMetrics = {
    totalRequests,
    successfulRequests,
    successRate: successfulRequests / totalRequests,
    avgResponseTime,
    requestsPerSecond: totalRequests / (duration / 1000),
    concurrency,
    duration: duration / 1000
  };
  
  console.log('🏋️ Load Test Results:');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Success Rate: ${(loadMetrics.successRate * 100).toFixed(2)}%`);
  console.log(`Requests/Second: ${loadMetrics.requestsPerSecond.toFixed(2)}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  
  return loadMetrics;
}

/**
 * Generate monitoring report
 */
async function generateMonitoringReport(environment, baseUrl) {
  console.log(`📋 Generating monitoring report for ${environment}...`);
  
  const report = {
    environment,
    baseUrl,
    timestamp: new Date().toISOString(),
    healthCheck: await performHealthCheck(baseUrl),
    oauthEndpoints: await checkOAuthEndpoints(baseUrl),
    performance: await monitorPerformance(baseUrl, 30000), // 30 second test
    loadTest: await performLoadTest(baseUrl, { concurrency: 5, duration: 15000 })
  };
  
  // Save report to file
  const reportDir = path.join(__dirname, '..', 'monitoring-reports');
  fs.mkdirSync(reportDir, { recursive: true });
  
  const reportFile = path.join(reportDir, `${environment}-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`📄 Report saved: ${reportFile}`);
  
  // Check against thresholds
  const config = monitoringConfig[environment];
  const alerts = [];
  
  if (report.performance.avgResponseTime > config.alertThresholds.responseTime) {
    alerts.push(`High response time: ${report.performance.avgResponseTime}ms > ${config.alertThresholds.responseTime}ms`);
  }
  
  if (report.performance.errorRate > config.alertThresholds.errorRate) {
    alerts.push(`High error rate: ${(report.performance.errorRate * 100).toFixed(2)}% > ${(config.alertThresholds.errorRate * 100)}%`);
  }
  
  if (report.performance.availability < config.alertThresholds.availability) {
    alerts.push(`Low availability: ${(report.performance.availability * 100).toFixed(2)}% < ${(config.alertThresholds.availability * 100)}%`);
  }
  
  if (alerts.length > 0) {
    console.log('🚨 ALERTS:');
    alerts.forEach(alert => console.log(`  - ${alert}`));
  } else {
    console.log('✅ All metrics within acceptable thresholds');
  }
  
  return { report, alerts };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  
  // Get base URL for environment
  const baseUrls = {
    development: 'https://dev.oauth-mcp-gateway.example.com',
    staging: 'https://staging.oauth-mcp-gateway.example.com',
    production: 'https://oauth-mcp-gateway.example.com'
  };
  
  const baseUrl = baseUrls[environment];
  
  switch (command) {
    case 'health':
      const healthResult = await performHealthCheck(baseUrl);
      console.log(JSON.stringify(healthResult, null, 2));
      return healthResult;
    case 'oauth':
      const oauthResults = await checkOAuthEndpoints(baseUrl);
      console.log(JSON.stringify(oauthResults, null, 2));
      return { success: true, results: oauthResults };
    case 'performance':
      const duration = parseInt(args[2]) || 60000;
      const perfResults = await monitorPerformance(baseUrl, duration);
      return { success: true, metrics: perfResults };
    case 'load':
      const concurrency = parseInt(args[2]) || 10;
      const loadDuration = parseInt(args[3]) || 30000;
      const loadResults = await performLoadTest(baseUrl, { concurrency, duration: loadDuration });
      return { success: true, metrics: loadResults };
    case 'report':
      const reportResults = await generateMonitoringReport(environment, baseUrl);
      return { success: true, ...reportResults };
    case 'help':
    default:
      console.log(`
Monitoring and Alerting Tool

Usage:
  health [environment]                    Perform health check
  oauth [environment]                     Check OAuth endpoints
  performance [environment] [duration]    Monitor performance (duration in ms)
  load [environment] [concurrency] [duration] Perform load test
  report [environment]                    Generate comprehensive report
  help                                    Show this help

Environments:
  development    Development environment (default)
  staging        Staging environment
  production     Production environment

Examples:
  health production
  performance staging 120000
  load production 20 60000
  report staging
      `);
      process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(result => {
    if (result && !result.success) {
      process.exit(1);
    }
  });
}

module.exports = {
  performHealthCheck,
  checkOAuthEndpoints,
  monitorPerformance,
  performLoadTest,
  generateMonitoringReport,
  monitoringConfig
};