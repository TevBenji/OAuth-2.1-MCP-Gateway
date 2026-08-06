import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantIsolationService, TenantQueryBuilder } from '../../src/database/queries';
import { TenantConfigService } from '../../src/database/config';
import { DatabaseManager } from '../../src/database/connection';

// Mock D1Database for testing
const mockD1Database = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      all: vi.fn(async () => ({ results: [] })),
      first: vi.fn(async () => null),
      run: vi.fn(async () => ({}))
    })),
    run: vi.fn(async () => ({}))
  })),
  exec: vi.fn(async () => ({}))
};

describe('Tenant Isolation and Database Layer', () => {
  describe('TenantIsolationService', () => {
    let tenantIsolationService: TenantIsolationService;

    beforeEach(() => {
      tenantIsolationService = new TenantIsolationService(mockD1Database as any);
      vi.clearAllMocks();
    });

    it('should ensure tenant isolation in SELECT queries', async () => {
      const query = 'SELECT * FROM oauth_clients';
      const tenantId = 'test-tenant-123';
      
      const result = tenantIsolationService['ensureTenantIsolation'](query, tenantId);
      
      expect(result).toContain('tenant_id');
      expect(result).toContain(tenantId);
    });

    it('should ensure tenant isolation in UPDATE queries', async () => {
      const query = 'UPDATE oauth_clients SET client_name = ? WHERE client_id = ?';
      const tenantId = 'test-tenant-123';
      
      const result = tenantIsolationService['ensureTenantIsolation'](query, tenantId);
      
      expect(result).toContain('tenant_id');
      expect(result).toContain(tenantId);
    });

    it('should ensure tenant isolation in DELETE queries', async () => {
      const query = 'DELETE FROM oauth_clients WHERE client_id = ?';
      const tenantId = 'test-tenant-123';
      
      const result = tenantIsolationService['ensureTenantIsolation'](query, tenantId);
      
      expect(result).toContain('tenant_id');
      expect(result).toContain(tenantId);
    });

    it('should detect existing tenant filters', () => {
      const queryWithFilter = 'SELECT * FROM oauth_clients WHERE tenant_id = ? AND client_name = ?';
      const tenantId = 'test-tenant-123';
      
      const hasFilter = (tenantIsolationService as any).hasTenantFilter(queryWithFilter, tenantId);
      expect(hasFilter).toBe(true);
    });

    it('should validate resource access correctly', async () => {
      // Mock the database response to simulate resource belonging to tenant
      mockD1Database.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => ({ '1': 1 })) // Simulate found resource
        }))
      })) as any;

      const hasAccess = await tenantIsolationService.hasResourceAccess(
        'tenant-123',
        'client',
        'client-456'
      );

      expect(hasAccess).toBe(true);
      expect(mockD1Database.prepare).toHaveBeenCalledWith(
        'SELECT 1 FROM oauth_clients WHERE id = ? AND tenant_id = ?'
      );
    });

    it('should prevent cross-tenant access', async () => {
      const isValid = await tenantIsolationService.validateCrossTenantAccess(
        'tenant-123',
        'tenant-456'
      );

      expect(isValid).toBe(false);
    });

    it('should allow same-tenant access', async () => {
      const isValid = await tenantIsolationService.validateCrossTenantAccess(
        'tenant-123',
        'tenant-123'
      );

      expect(isValid).toBe(true);
    });
  });

  describe('TenantQueryBuilder', () => {
    it('should build a query with tenant filter automatically', () => {
      const tenantId = 'test-tenant-123';
      const builder = new TenantQueryBuilder(tenantId);
      
      const { query, params } = builder
        .select('id, client_name')
        .from('oauth_clients')
        .where('client_name LIKE ?', '%test%')
        .build();
      
      expect(query).toContain('tenant_id');
      expect(query).toContain('client_name LIKE ?');
      expect(params).toContain(tenantId);
      expect(params).toContain('%test%');
    });

    it('should add explicit tenant filter when requested', () => {
      const tenantId = 'test-tenant-123';
      const builder = new TenantQueryBuilder(tenantId);
      
      const { query, params } = builder
        .select('*')
        .from('users')
        .addTenantFilter()
        .build();
      
      expect(query).toContain('tenant_id');
      expect(params).toContain(tenantId);
    });

    it('should build complex queries with multiple conditions', () => {
      const tenantId = 'test-tenant-123';
      const builder = new TenantQueryBuilder(tenantId);
      
      const { query, params } = builder
        .select('*')
        .from('access_tokens')
        .where('user_id = ?', 'user-123')
        .andWhere('expires_at > ?', Date.now())
        .orderBy('created_at', 'DESC')
        .limit(10)
        .build();
      
      expect(query).toContain('tenant_id');
      expect(query).toContain('user_id = ?');
      expect(query).toContain('expires_at > ?');
      expect(query).toContain('ORDER BY');
      expect(query).toContain('LIMIT 10');
      expect(params).toContain(tenantId);
      expect(params).toContain('user-123');
    });
  });

  describe('TenantConfigService', () => {
    let mockDbManager: DatabaseManager;
    let tenantConfigService: TenantConfigService;

    beforeEach(() => {
      mockDbManager = {
        getDatabase: () => mockD1Database as any,
        setTenantContext: vi.fn(),
        getTenantContext: vi.fn(),
        executeWithTenant: vi.fn(),
        validateTenantId: vi.fn(async () => true),
        withTenantContext: vi.fn(),
      } as any;
      
      tenantConfigService = new TenantConfigService(mockDbManager);
    });

    it('should create a new tenant with default configuration', async () => {
      const newTenant = await tenantConfigService.createTenant(
        'new-tenant-id',
        'New Tenant',
        'A new test tenant'
      );
      
      expect(newTenant.id).toBe('new-tenant-id');
      expect(newTenant.name).toBe('New Tenant');
      expect(newTenant.description).toBe('A new test tenant');
      expect(newTenant.compliance_tier).toBe('basic');
      expect(newTenant.status).toBe('onboarding');
    });

    it('should get tenant configuration', async () => {
      const config = await tenantConfigService.getTenantConfig('test-tenant');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('test-tenant');
    });

    it('should update tenant configuration', async () => {
      const updatedConfig = await tenantConfigService.updateTenantConfig(
        'test-tenant',
        { compliance_tier: 'enterprise' }
      );
      
      expect(updatedConfig).toBeDefined();
      expect(updatedConfig?.compliance_tier).toBe('enterprise');
    });

    it('should update compliance tier and adjust limits accordingly', async () => {
      const updatedConfig = await tenantConfigService.updateComplianceTier(
        'test-tenant',
        'enterprise'
      );
      
      expect(updatedConfig).toBeDefined();
      expect(updatedConfig?.compliance_tier).toBe('enterprise');
      if (updatedConfig) {
        expect(updatedConfig.limits.max_clients).toBe(100); // Enterprise tier limit
      }
    });

    it('should check if tenant limits are exceeded', async () => {
      const isExceeded = await tenantConfigService.isLimitExceeded(
        'test-tenant',
        'max_clients'
      );
      
      expect(isExceeded).toBe(false); // Based on our mock implementation
    });
  });

  describe('DatabaseManager', () => {
    let dbManager: DatabaseManager;

    beforeEach(() => {
      dbManager = new DatabaseManager(mockD1Database as any);
    });

    it('should set and get tenant context', () => {
      const context = { 
        tenantId: 'test-tenant-123', 
        userId: 'test-user-456',
        requestId: 'req-789' 
      };
      
      dbManager.setTenantContext(context);
      const retrievedContext = dbManager.getTenantContext();
      
      expect(retrievedContext).toEqual(context);
    });

    it('should validate tenant ID', async () => {
      // Mock response for a valid tenant
      mockD1Database.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => ({ '1': 1 }))
        }))
      })) as any;

      const isValid = await dbManager.validateTenantId('valid-tenant');
      expect(isValid).toBe(true);
    });

    it('should add tenant filter to queries', () => {
      const query = 'SELECT * FROM oauth_clients WHERE client_name = ?';
      const tenantId = 'test-tenant-123';
      
      const result = dbManager['addTenantFilter'](query, tenantId);
      
      expect(result).toContain('tenant_id');
      expect(result).toContain(tenantId);
    });
  });
});