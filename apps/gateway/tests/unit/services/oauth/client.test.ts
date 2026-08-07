/**
 * OAuth Client Service Unit Tests
 *
 * Tests for client registration, validation, and management functionality
 * against the real Postgres test database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClientService } from '../../../../src/services/oauth/client';
import type { ClientRegistrationRequest } from '../../../../src/types/oauth';
import { getTestDb, createTenant } from '../../../helpers/db';

describe('ClientService', () => {
  let clientService: ClientService;

  const validRequest: ClientRegistrationRequest = {
    redirect_uris: ['https://example.com/callback'],
    client_name: 'Test Client',
    client_uri: 'https://example.com',
    scope: 'mcp:tools:read mcp:resources:read',
    contacts: ['admin@example.com'],
    token_endpoint_auth_method: 'client_secret_post',
  };

  beforeEach(async () => {
    await createTenant('test-tenant');
    clientService = new ClientService(getTestDb().db);
  });

  describe('registerClient', () => {
    it('should register a client with client_secret', async () => {
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
        token_endpoint_auth_method: 'client_secret_post',
      });
    });

    it('should register a public client without client_secret', async () => {
      const publicRequest = {
        ...validRequest,
        token_endpoint_auth_method: 'none' as const,
      };

      const result = await clientService.registerClient(publicRequest, 'test-tenant');

      expect(result.client_secret).toBeUndefined();
      expect(result.client_secret_expires_at).toBeUndefined();
      expect(result.token_endpoint_auth_method).toBe('none');
    });

    it('should use default grant types and response types', async () => {
      const minimalRequest: ClientRegistrationRequest = {
        redirect_uris: ['https://example.com/callback'],
      };

      const result = await clientService.registerClient(minimalRequest, 'test-tenant');

      expect(result.grant_types).toEqual(['authorization_code', 'refresh_token']);
      expect(result.response_types).toEqual(['code']);
      expect(result.token_endpoint_auth_method).toBe('client_secret_post');
    });

    it('should generate unique client_id with proper prefix', async () => {
      const result1 = await clientService.registerClient(validRequest, 'test-tenant');
      const result2 = await clientService.registerClient(validRequest, 'test-tenant');

      expect(result1.client_id).toMatch(/^mcp_client_[a-f0-9]{32}$/);
      expect(result2.client_id).toMatch(/^mcp_client_[a-f0-9]{32}$/);
      expect(result1.client_id).not.toBe(result2.client_id);
    });

    it('should generate secure client_secret with proper prefix', async () => {
      const result = await clientService.registerClient(validRequest, 'test-tenant');

      expect(result.client_secret).toMatch(/^mcp_secret_[A-Za-z0-9_-]+$/);
      expect(result.client_secret!.length).toBeGreaterThan(20);
    });
  });

  describe('getClient', () => {
    it('should retrieve and parse client data correctly', async () => {
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.getClient(registered.client_id, 'test-tenant');

      expect(result).toMatchObject({
        client_id: registered.client_id,
        tenant_id: 'test-tenant',
        redirect_uris: ['https://example.com/callback'],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        contacts: ['admin@example.com'],
      });
    });

    it('should return null for non-existent client', async () => {
      const result = await clientService.getClient('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });

    it('should look up client without tenant_id when not provided', async () => {
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.getClient(registered.client_id);

      expect(result?.client_id).toBe(registered.client_id);
    });

    it('should not return a client for the wrong tenant', async () => {
      await createTenant('other-tenant');
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.getClient(registered.client_id, 'other-tenant');

      expect(result).toBeNull();
    });
  });

  describe('validateClient', () => {
    it('should validate client with correct secret', async () => {
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.validateClient(
        registered.client_id,
        registered.client_secret,
        'test-tenant'
      );

      expect(result).toBe(true);
    });

    it('should reject client with incorrect secret', async () => {
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.validateClient(
        registered.client_id,
        'wrong_secret',
        'test-tenant'
      );

      expect(result).toBe(false);
    });

    it('should validate public client without secret', async () => {
      const registered = await clientService.registerClient(
        { ...validRequest, token_endpoint_auth_method: 'none' as const },
        'test-tenant'
      );

      const result = await clientService.validateClient(
        registered.client_id,
        undefined,
        'test-tenant'
      );

      expect(result).toBe(true);
    });

    it('should reject non-existent client', async () => {
      const result = await clientService.validateClient('non-existent', 'any-secret', 'test-tenant');

      expect(result).toBe(false);
    });
  });

  describe('isValidRedirectUri', () => {
    const multiUriRequest: ClientRegistrationRequest = {
      ...validRequest,
      redirect_uris: ['https://example.com/callback', 'https://app.example.com/auth'],
    };

    it('should validate registered redirect URI', async () => {
      const registered = await clientService.registerClient(multiUriRequest, 'test-tenant');

      const result = await clientService.isValidRedirectUri(
        registered.client_id,
        'https://example.com/callback',
        'test-tenant'
      );

      expect(result).toBe(true);
    });

    it('should reject unregistered redirect URI', async () => {
      const registered = await clientService.registerClient(multiUriRequest, 'test-tenant');

      const result = await clientService.isValidRedirectUri(
        registered.client_id,
        'https://malicious.com/callback',
        'test-tenant'
      );

      expect(result).toBe(false);
    });

    it('should reject for non-existent client', async () => {
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
      const registered = await clientService.registerClient(validRequest, 'test-tenant');

      const result = await clientService.deleteClient(registered.client_id, 'test-tenant');

      expect(result).toBe(true);
      expect(await clientService.getClient(registered.client_id, 'test-tenant')).toBeNull();
    });

    it('should return false for non-existent client', async () => {
      const result = await clientService.deleteClient('non-existent', 'test-tenant');

      expect(result).toBe(false);
    });
  });
});
