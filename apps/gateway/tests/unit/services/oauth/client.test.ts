/**
 * OAuth Client Service Unit Tests
 * 
 * Tests for client registration, validation, and management functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientService } from '../../../../src/services/oauth/client';
import type { ClientRegistrationRequest } from '../../../../src/types/oauth';

// Mock D1Database
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
  dump: vi.fn()
};

const mockStatement = {
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  run: vi.fn(),
  all: vi.fn()
};

describe('ClientService', () => {
  let clientService: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStatement);
    clientService = new ClientService(mockDb as any);
  });

  describe('registerClient', () => {
    const validRequest: ClientRegistrationRequest = {
      redirect_uris: ['https://example.com/callback'],
      client_name: 'Test Client',
      client_uri: 'https://example.com',
      scope: 'mcp:tools:read mcp:resources:read',
      contacts: ['admin@example.com'],
      token_endpoint_auth_method: 'client_secret_post'
    };

    it('should register a client with client_secret', async () => {
      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result = await clientService.registerClient(validRequest, 'test-tenant');

      expect(result).toMatchObject({
        client_id: expect.stringMatching(/^mcp_client_/),
        client_secret: expect.stringMatching(/^mcp_secret_/),
        client_id_issued_at: expect.any(Number),
        client_secret_expires_at: expect.any(Number),
        redirect_uris: validRequest.redirect_uris,
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        client_name: validRequest.client_name,
        token_endpoint_auth_method: 'client_secret_post'
      });

      expect(mockDb.prepare).toHaveBeenCalled();
      expect(mockStatement.bind).toHaveBeenCalled();
      expect(mockStatement.run).toHaveBeenCalled();
    });

    it('should register a public client without client_secret', async () => {
      const publicRequest = {
        ...validRequest,
        token_endpoint_auth_method: 'none' as const
      };

      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result = await clientService.registerClient(publicRequest, 'test-tenant');

      expect(result.client_secret).toBeUndefined();
      expect(result.client_secret_expires_at).toBeUndefined();
      expect(result.token_endpoint_auth_method).toBe('none');
    });

    it('should use default grant types and response types', async () => {
      const minimalRequest: ClientRegistrationRequest = {
        redirect_uris: ['https://example.com/callback']
      };

      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result = await clientService.registerClient(minimalRequest, 'test-tenant');

      expect(result.grant_types).toEqual(['authorization_code', 'refresh_token']);
      expect(result.response_types).toEqual(['code']);
      expect(result.token_endpoint_auth_method).toBe('client_secret_post');
    });

    it('should generate unique client_id with proper prefix', async () => {
      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result1 = await clientService.registerClient(validRequest, 'test-tenant');
      const result2 = await clientService.registerClient(validRequest, 'test-tenant');

      expect(result1.client_id).toMatch(/^mcp_client_[a-f0-9]{32}$/);
      expect(result2.client_id).toMatch(/^mcp_client_[a-f0-9]{32}$/);
      expect(result1.client_id).not.toBe(result2.client_id);
    });

    it('should generate secure client_secret with proper prefix', async () => {
      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result = await clientService.registerClient(validRequest, 'test-tenant');

      expect(result.client_secret).toMatch(/^mcp_secret_[A-Za-z0-9_-]+$/);
      expect(result.client_secret!.length).toBeGreaterThan(20);
    });
  });

  describe('getClient', () => {
    const mockClientData = {
      client_id: 'mcp_client_test123',
      client_secret: 'mcp_secret_test456',
      tenant_id: 'test-tenant',
      redirect_uris: '["https://example.com/callback"]',
      grant_types: '["authorization_code", "refresh_token"]',
      response_types: '["code"]',
      scope: 'mcp:tools:read',
      client_name: 'Test Client',
      token_endpoint_auth_method: 'client_secret_post',
      client_id_issued_at: 1234567890,
      contacts: '["admin@example.com"]'
    };

    it('should retrieve and parse client data correctly', async () => {
      mockStatement.first.mockResolvedValue(mockClientData);

      const result = await clientService.getClient('mcp_client_test123', 'test-tenant');

      expect(result).toMatchObject({
        client_id: 'mcp_client_test123',
        redirect_uris: ['https://example.com/callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        contacts: ['admin@example.com']
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM oauth_clients')
      );
      expect(mockStatement.bind).toHaveBeenCalledWith('mcp_client_test123', 'test-tenant');
    });

    it('should return null for non-existent client', async () => {
      mockStatement.first.mockResolvedValue(null);

      const result = await clientService.getClient('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });

    it('should query without tenant_id when not provided', async () => {
      mockStatement.first.mockResolvedValue(mockClientData);

      await clientService.getClient('mcp_client_test123');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM oauth_clients')
      );
      expect(mockStatement.bind).toHaveBeenCalledWith('mcp_client_test123');
    });
  });

  describe('validateClient', () => {
    const mockClient = {
      client_id: 'mcp_client_test123',
      client_secret: 'mcp_secret_test456',
      token_endpoint_auth_method: 'client_secret_post',
      redirect_uris: ['https://example.com/callback'],
      grant_types: ['authorization_code'],
      response_types: ['code']
    };

    it('should validate client with correct secret', async () => {
      mockStatement.first.mockResolvedValue({
        ...mockClient,
        redirect_uris: JSON.stringify(mockClient.redirect_uris),
        grant_types: JSON.stringify(mockClient.grant_types),
        response_types: JSON.stringify(mockClient.response_types)
      });

      const result = await clientService.validateClient(
        'mcp_client_test123',
        'mcp_secret_test456',
        'test-tenant'
      );

      expect(result).toBe(true);
    });

    it('should reject client with incorrect secret', async () => {
      mockStatement.first.mockResolvedValue({
        ...mockClient,
        redirect_uris: JSON.stringify(mockClient.redirect_uris),
        grant_types: JSON.stringify(mockClient.grant_types),
        response_types: JSON.stringify(mockClient.response_types)
      });

      const result = await clientService.validateClient(
        'mcp_client_test123',
        'wrong_secret',
        'test-tenant'
      );

      expect(result).toBe(false);
    });

    it('should validate public client without secret', async () => {
      const publicClient = {
        ...mockClient,
        token_endpoint_auth_method: 'none',
        client_secret: undefined
      };

      mockStatement.first.mockResolvedValue({
        ...publicClient,
        redirect_uris: JSON.stringify(publicClient.redirect_uris),
        grant_types: JSON.stringify(publicClient.grant_types),
        response_types: JSON.stringify(publicClient.response_types)
      });

      const result = await clientService.validateClient('mcp_client_test123', undefined, 'test-tenant');

      expect(result).toBe(true);
    });

    it('should reject non-existent client', async () => {
      mockStatement.first.mockResolvedValue(null);

      const result = await clientService.validateClient('non-existent', 'any-secret', 'test-tenant');

      expect(result).toBe(false);
    });
  });

  describe('isValidRedirectUri', () => {
    const mockClient = {
      client_id: 'mcp_client_test123',
      redirect_uris: ['https://example.com/callback', 'https://app.example.com/auth'],
      grant_types: ['authorization_code'],
      response_types: ['code']
    };

    it('should validate registered redirect URI', async () => {
      mockStatement.first.mockResolvedValue({
        ...mockClient,
        redirect_uris: JSON.stringify(mockClient.redirect_uris),
        grant_types: JSON.stringify(mockClient.grant_types),
        response_types: JSON.stringify(mockClient.response_types)
      });

      const result = await clientService.isValidRedirectUri(
        'mcp_client_test123',
        'https://example.com/callback',
        'test-tenant'
      );

      expect(result).toBe(true);
    });

    it('should reject unregistered redirect URI', async () => {
      mockStatement.first.mockResolvedValue({
        ...mockClient,
        redirect_uris: JSON.stringify(mockClient.redirect_uris),
        grant_types: JSON.stringify(mockClient.grant_types),
        response_types: JSON.stringify(mockClient.response_types)
      });

      const result = await clientService.isValidRedirectUri(
        'mcp_client_test123',
        'https://malicious.com/callback',
        'test-tenant'
      );

      expect(result).toBe(false);
    });

    it('should reject for non-existent client', async () => {
      mockStatement.first.mockResolvedValue(null);

      const result = await clientService.isValidRedirectUri(
        'non-existent',
        'https://example.com/callback',
        'test-tenant'
      );

      expect(result).toBe(false);
    });
  });

  describe('deleteClient', () => {
    it('should delete existing client', async () => {
      mockStatement.run.mockResolvedValue({ success: true, changes: 1 });

      const result = await clientService.deleteClient('mcp_client_test123', 'test-tenant');

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM oauth_clients WHERE client_id = ? AND tenant_id = ?')
      );
      expect(mockStatement.bind).toHaveBeenCalledWith('mcp_client_test123', 'test-tenant');
    });

    it('should return false for non-existent client', async () => {
      mockStatement.run.mockResolvedValue({ success: true, changes: 0 });

      const result = await clientService.deleteClient('non-existent', 'test-tenant');

      expect(result).toBe(false);
    });
  });
});