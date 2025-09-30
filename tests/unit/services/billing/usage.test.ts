/**
 * Unit tests for Usage Tracking Service
 */

import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { UsageTrackingService } from '@/services/billing/usage';
import { UsageRecord } from '@/types/usage';
import { Bindings } from '@/types/bindings';

// Mock D1Database and KVNamespace for testing
const mockD1Prepare = {
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({ success: true }),
  all: vi.fn().mockResolvedValue({ results: [] }),
  first: vi.fn().mockResolvedValue(null),
};

const mockD1Database = {
  prepare: vi.fn().mockReturnValue(mockD1Prepare),
};

const mockKVNamespace = {
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockBindings: Bindings = {
  DB: mockD1Database as any,
  USAGE_KV: mockKVNamespace as any,
  // Add other required bindings
  JWT_ISSUER: 'test-issuer',
  PKCE_REQUIRED: 'true',
  CORS_ORIGINS: 'http://localhost:3000',
} as any;

describe('UsageTrackingService', () => {
  let usageService: UsageTrackingService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    usageService = new UsageTrackingService(mockBindings);
  });

  describe('recordUsage', () => {
    it('should record a usage event successfully', async () => {
      const usageRecord = {
        tenant_id: 'test-tenant-id',
        user_id: 'test-user-id',
        client_id: 'test-client-id',
        resource_id: 'test-resource-id',
        action: 'mcp_request',
        metadata: { method: 'GET', path: '/api/test' },
      };

      mockD1Prepare.run.mockResolvedValueOnce({ success: true });

      await expect(usageService.recordUsage(usageRecord)).resolves.not.toThrow();

      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records')
      );
      expect(mockD1Prepare.bind).toHaveBeenCalled();
      expect(mockD1Prepare.run).toHaveBeenCalled();
    });

    it('should handle missing optional fields in usage record', async () => {
      const usageRecord = {
        tenant_id: 'test-tenant-id',
        action: 'auth_request',
      };

      mockD1Prepare.run.mockResolvedValueOnce({ success: true });

      await expect(usageService.recordUsage(usageRecord)).resolves.not.toThrow();

      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records')
      );
    });
  });

  describe('getCurrentUsage', () => {
    it('should return current usage from KV', async () => {
      const mockUsageData = {
        tenant_id: 'test-tenant-id',
        period_start: new Date(),
        period_end: new Date(),
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        mcp_requests: 80,
        token_requests: 10,
        auth_requests: 10,
        peak_concurrent_requests: 10,
        average_response_time_ms: 250,
        data_processed_bytes: 1024,
        billable_requests: 100,
        overage_requests: 0,
        estimated_cost: 0,
        currency: 'USD'
      };

      mockKVNamespace.get.mockResolvedValueOnce(mockUsageData);

      const result = await usageService.getCurrentUsage('test-tenant-id');

      expect(result).toEqual(mockUsageData);
      expect(mockKVNamespace.get).toHaveBeenCalledWith(
        expect.stringMatching(/^usage:test-tenant-id:\d{4}-\d{2}$/),
        'json'
      );
    });

    it('should return null if no usage data exists', async () => {
      mockKVNamespace.get.mockResolvedValueOnce(null);

      const result = await usageService.getCurrentUsage('test-tenant-id');

      expect(result).toBeNull();
    });
  });

  describe('getHistoricalUsage', () => {
    it('should return historical usage records from database', async () => {
      const mockRecords: UsageRecord[] = [
        {
          id: 'record-1',
          tenant_id: 'test-tenant-id',
          user_id: 'user-1',
          client_id: 'client-1',
          resource_id: 'resource-1',
          action: 'mcp_request',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'record-2',
          tenant_id: 'test-tenant-id',
          user_id: 'user-2',
          client_id: 'client-2',
          resource_id: 'resource-2',
          action: 'token_request',
          timestamp: new Date().toISOString(),
        }
      ];

      mockD1Prepare.all.mockResolvedValueOnce({ results: mockRecords });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const result = await usageService.getHistoricalUsage('test-tenant-id', startDate, endDate);

      expect(result).toEqual(mockRecords);
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM usage_records')
      );
    });
  });

  describe('getUsageAlerts', () => {
    it('should return active usage alerts for a tenant', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          tenant_id: 'test-tenant-id',
          alert_type: 'usage_threshold',
          threshold_type: 'percentage',
          threshold_value: 80,
          triggered_at: new Date().toISOString(),
          resolved_at: null,
          notification_sent: false,
          severity: 'high',
          message: 'Usage threshold exceeded'
        }
      ];

      mockD1Prepare.all.mockResolvedValueOnce({ results: mockAlerts });

      const result = await usageService.getUsageAlerts('test-tenant-id');

      expect(result).toEqual(mockAlerts);
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM usage_alerts')
      );
    });
  });

  describe('createUsageAlert', () => {
    it('should create a new usage alert', async () => {
      const alertData = {
        tenant_id: 'test-tenant-id',
        alert_type: 'usage_threshold',
        threshold_type: 'percentage',
        threshold_value: 90,
        severity: 'critical',
        message: 'Critical usage threshold reached'
      };

      mockD1Prepare.run.mockResolvedValueOnce({ success: true });

      const result = await usageService.createUsageAlert(alertData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('triggered_at');
      expect(result.notification_sent).toBe(false);
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_alerts')
      );
    });
  });
});