/**
 * IdP Federation Integration Tests
 *
 * Tests for OIDC/SAML federation with mock IdP responses.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OIDCFederationService } from '../../src/services/idp/oidc';
import { SAMLFederationService } from '../../src/services/idp/saml';
import { AttributeMappingService, RoleSynchronizationService } from '../../src/services/idp/mapping';
import { JITProvisioningService } from '../../src/services/idp/provisioning';
import { IdPManagerService } from '../../src/services/idp/manager';
import {
  IdPConfig,
  IdPType,
  IdPProvider,
  OIDCDiscoveryMetadata,
} from '../../src/types/idp';

// Mock fetch globally
global.fetch = vi.fn();

describe('IdP Federation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OIDC Federation', () => {
    const mockOIDCConfig: IdPConfig = {
      idp_id: 'idp-oidc-123',
      tenant_id: 'tenant-123',
      provider: IdPProvider.AUTH0,
      type: IdPType.OIDC,
      name: 'Auth0 Integration',
      enabled: true,
      oidc_config: {
        issuer: 'https://auth0.example.com',
        client_id: 'client123',
        client_secret: 'secret123',
        scopes: ['openid', 'profile', 'email'],
        response_type: 'code',
      },
      attribute_mapping: {
        user_id: 'sub',
        email: 'email',
        name: 'name',
        given_name: 'given_name',
        family_name: 'family_name',
        picture: 'picture',
      },
      role_mapping: {
        role_claim: 'roles',
        mappings: {
          admin: 'administrator',
          user: 'member',
        },
        default_role: 'guest',
      },
      provisioning: {
        enabled: true,
        create_users: true,
        update_users: true,
        deactivate_on_remove: false,
        sync_roles: true,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should discover OIDC configuration', async () => {
      const oidcService = new OIDCFederationService();

      const mockDiscovery: OIDCDiscoveryMetadata = {
        issuer: 'https://auth0.example.com',
        authorization_endpoint: 'https://auth0.example.com/authorize',
        token_endpoint: 'https://auth0.example.com/oauth/token',
        userinfo_endpoint: 'https://auth0.example.com/userinfo',
        jwks_uri: 'https://auth0.example.com/.well-known/jwks.json',
        scopes_supported: ['openid', 'profile', 'email'],
        response_types_supported: ['code', 'token', 'id_token'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        token_endpoint_auth_methods_supported: ['client_secret_post'],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDiscovery,
      });

      const metadata = await oidcService.discoverConfiguration('https://auth0.example.com');

      expect(metadata.issuer).toBe('https://auth0.example.com');
      expect(metadata.authorization_endpoint).toBe('https://auth0.example.com/authorize');
      expect(metadata.token_endpoint).toBe('https://auth0.example.com/oauth/token');
    });

    it('should build OIDC authorization URL', () => {
      const oidcService = new OIDCFederationService();

      const authUrl = oidcService.buildAuthorizationUrl(mockOIDCConfig, {
        idp_id: 'idp-oidc-123',
        tenant_id: 'tenant-123',
        redirect_uri: 'https://gateway.example.com/callback',
        state: 'state123',
        nonce: 'nonce123',
        code_challenge: 'challenge123',
        code_challenge_method: 'S256',
      });

      expect(authUrl).toContain('https://auth0.example.com/authorize');
      expect(authUrl).toContain('client_id=client123');
      expect(authUrl).toContain('redirect_uri=https%3A%2F%2Fgateway.example.com%2Fcallback');
      expect(authUrl).toContain('state=state123');
      expect(authUrl).toContain('nonce=nonce123');
      expect(authUrl).toContain('code_challenge=challenge123');
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('should exchange authorization code for tokens', async () => {
      const oidcService = new OIDCFederationService();

      const mockTokenResponse = {
        access_token: 'access_token_123',
        id_token: 'id_token_123',
        refresh_token: 'refresh_token_123',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const tokens = await oidcService.exchangeCode(
        mockOIDCConfig,
        'auth_code_123',
        'https://gateway.example.com/callback',
        'verifier123'
      );

      expect(tokens.access_token).toBe('access_token_123');
      expect(tokens.id_token).toBe('id_token_123');
      expect(tokens.refresh_token).toBe('refresh_token_123');
      expect(tokens.expires_in).toBe(3600);
    });

    it('should extract Auth0-specific claims', () => {
      const oidcService = new OIDCFederationService();

      const rawClaims = {
        sub: 'auth0|123456',
        email: 'user@example.com',
        email_verified: true,
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
        'https://your-app.com/roles': ['admin', 'user'],
      };

      const extracted = oidcService.extractProviderClaims(IdPProvider.AUTH0, rawClaims);

      expect(extracted.user_id).toBe('auth0|123456');
      expect(extracted.email).toBe('user@example.com');
      expect(extracted.roles).toEqual(['admin', 'user']);
    });

    it('should extract Okta-specific claims', () => {
      const oidcService = new OIDCFederationService();

      const rawClaims = {
        sub: 'okta123456',
        email: 'user@example.com',
        email_verified: true,
        name: 'Jane Smith',
        given_name: 'Jane',
        family_name: 'Smith',
        groups: ['Admins', 'Users'],
        preferred_username: 'jsmith',
      };

      const extracted = oidcService.extractProviderClaims(IdPProvider.OKTA, rawClaims);

      expect(extracted.user_id).toBe('okta123456');
      expect(extracted.roles).toEqual(['Admins', 'Users']);
      expect(extracted.preferred_username).toBe('jsmith');
    });

    it('should extract Microsoft Entra claims', () => {
      const oidcService = new OIDCFederationService();

      const rawClaims = {
        oid: 'azure123456',
        email: 'user@company.com',
        name: 'Bob Johnson',
        given_name: 'Bob',
        family_name: 'Johnson',
        roles: ['GlobalAdmin'],
        tid: 'tenant123',
        unique_name: 'bjohnson@company.com',
      };

      const extracted = oidcService.extractProviderClaims(
        IdPProvider.MICROSOFT_ENTRA,
        rawClaims
      );

      expect(extracted.user_id).toBe('azure123456');
      expect(extracted.roles).toEqual(['GlobalAdmin']);
      expect(extracted.tenant_id).toBe('tenant123');
    });
  });

  describe('Attribute Mapping', () => {
    const mockConfig: IdPConfig = {
      idp_id: 'idp-123',
      tenant_id: 'tenant-123',
      provider: IdPProvider.OKTA,
      type: IdPType.OIDC,
      name: 'Okta Integration',
      enabled: true,
      attribute_mapping: {
        user_id: 'sub',
        email: 'email',
        name: 'name',
        given_name: 'given_name',
        family_name: 'family_name',
        picture: 'picture',
        custom_attributes: {
          department: 'department',
          employee_id: 'employeeNumber',
        },
      },
      role_mapping: {
        role_claim: 'groups',
        mappings: {
          'Engineering': 'engineer',
          'Sales': 'sales',
          'Admin': 'administrator',
        },
        default_role: 'member',
      },
      provisioning: {
        enabled: true,
        create_users: true,
        update_users: true,
        deactivate_on_remove: false,
        sync_roles: true,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should map standard attributes', () => {
      const mappingService = new AttributeMappingService();

      const claims = {
        sub: 'user123',
        email: 'user@example.com',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
      };

      const mapped = mappingService.mapAttributes(mockConfig, claims);

      expect(mapped.idp_user_id).toBe('user123');
      expect(mapped.email).toBe('user@example.com');
      expect(mapped.name).toBe('John Doe');
      expect(mapped.given_name).toBe('John');
      expect(mapped.family_name).toBe('Doe');
      expect(mapped.picture).toBe('https://example.com/photo.jpg');
    });

    it('should map custom attributes', () => {
      const mappingService = new AttributeMappingService();

      const claims = {
        sub: 'user123',
        email: 'user@example.com',
        department: 'Engineering',
        employeeNumber: 'EMP001',
      };

      const mapped = mappingService.mapAttributes(mockConfig, claims);

      expect(mapped.raw_claims?.department).toBe('Engineering');
      expect(mapped.raw_claims?.employee_id).toBe('EMP001');
    });

    it('should map roles correctly', () => {
      const mappingService = new AttributeMappingService();

      const claims = {
        sub: 'user123',
        email: 'user@example.com',
        groups: ['Engineering', 'Admin'],
      };

      const roles = mappingService.mapRoles(mockConfig, claims);

      expect(roles).toContain('engineer');
      expect(roles).toContain('administrator');
    });

    it('should use default role for unmapped roles', () => {
      const mappingService = new AttributeMappingService();

      const claims = {
        sub: 'user123',
        email: 'user@example.com',
        groups: ['UnknownGroup'],
      };

      const roles = mappingService.mapRoles(mockConfig, claims);

      expect(roles).toContain('member');
    });

    it('should handle nested attribute paths', () => {
      const mappingService = new AttributeMappingService();

      const configWithNested: IdPConfig = {
        ...mockConfig,
        attribute_mapping: {
          user_id: 'user.id',
          email: 'user.profile.email',
        },
      };

      const claims = {
        user: {
          id: 'user123',
          profile: {
            email: 'user@example.com',
          },
        },
      };

      const mapped = mappingService.mapAttributes(configWithNested, claims);

      expect(mapped.idp_user_id).toBe('user123');
      expect(mapped.email).toBe('user@example.com');
    });
  });

  describe('JIT User Provisioning', () => {
    const mockConfig: IdPConfig = {
      idp_id: 'idp-123',
      tenant_id: 'tenant-123',
      provider: IdPProvider.OKTA,
      type: IdPType.OIDC,
      name: 'Okta Integration',
      enabled: true,
      attribute_mapping: {
        user_id: 'sub',
        email: 'email',
      },
      role_mapping: {
        role_claim: 'groups',
        mappings: {},
      },
      provisioning: {
        enabled: true,
        create_users: true,
        update_users: true,
        deactivate_on_remove: false,
        sync_roles: true,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create new user on first login', async () => {
      const provisioningService = new JITProvisioningService();

      const authResponse = {
        idp_user_id: 'okta123',
        email: 'newuser@example.com',
        email_verified: true,
        name: 'New User',
      };

      const result = await provisioningService.provisionUser(mockConfig, authResponse);

      expect(result.is_new_user).toBe(true);
      expect(result.user_id).toBeDefined();
      expect(result.federated_identity.idp_user_id).toBe('okta123');
      expect(result.federated_identity.email).toBe('newuser@example.com');
    });

    it('should validate user eligibility', () => {
      const provisioningService = new JITProvisioningService();

      // Valid user
      let result = provisioningService.validateUserEligibility(mockConfig, {
        idp_user_id: 'user123',
        email: 'user@example.com',
        email_verified: true,
      });
      expect(result.eligible).toBe(true);

      // Missing email
      result = provisioningService.validateUserEligibility(mockConfig, {
        idp_user_id: 'user123',
        email_verified: true,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Email');

      // Email not verified
      result = provisioningService.validateUserEligibility(mockConfig, {
        idp_user_id: 'user123',
        email: 'user@example.com',
        email_verified: false,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('verified');
    });

    it('should reject provisioning when disabled', async () => {
      const provisioningService = new JITProvisioningService();

      const disabledConfig = {
        ...mockConfig,
        provisioning: {
          ...mockConfig.provisioning,
          enabled: false,
        },
      };

      await expect(
        provisioningService.provisionUser(disabledConfig, {
          idp_user_id: 'user123',
          email: 'user@example.com',
          email_verified: true,
        })
      ).rejects.toThrow('not enabled');
    });
  });

  describe('End-to-End IdP Flow', () => {
    it('should complete full OIDC authentication flow', async () => {
      const idpManager = new IdPManagerService();

      const mockConfig: IdPConfig = {
        idp_id: 'idp-123',
        tenant_id: 'tenant-123',
        provider: IdPProvider.OKTA,
        type: IdPType.OIDC,
        name: 'Okta Integration',
        enabled: true,
        oidc_config: {
          issuer: 'https://okta.example.com',
          client_id: 'client123',
          client_secret: 'secret123',
          scopes: ['openid', 'profile', 'email'],
          response_type: 'code',
        },
        attribute_mapping: {
          user_id: 'sub',
          email: 'email',
          name: 'name',
        },
        role_mapping: {
          role_claim: 'groups',
          mappings: {
            'Admins': 'administrator',
          },
        },
        provisioning: {
          enabled: true,
          create_users: true,
          update_users: true,
          deactivate_on_remove: false,
          sync_roles: true,
        },
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Build auth URL
      const authUrl = await idpManager.initiateAuthentication(mockConfig, {
        idp_id: 'idp-123',
        tenant_id: 'tenant-123',
        redirect_uri: 'https://gateway.example.com/callback',
        state: 'state123',
      });

      expect(authUrl).toContain('https://okta.example.com');
      expect(authUrl).toContain('client_id=client123');
    });
  });

  describe('SAML Federation', () => {
    it('should build SAML AuthnRequest', () => {
      const samlService = new SAMLFederationService();

      const mockConfig: IdPConfig = {
        idp_id: 'idp-saml-123',
        tenant_id: 'tenant-123',
        provider: IdPProvider.OKTA,
        type: IdPType.SAML,
        name: 'Okta SAML',
        enabled: true,
        saml_config: {
          entity_id: 'https://gateway.example.com',
          sso_url: 'https://okta.example.com/sso/saml',
          certificate: 'CERT_DATA',
          signature_algorithm: 'sha256',
          digest_algorithm: 'sha256',
          name_id_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          want_assertions_signed: true,
          want_response_signed: true,
        },
        attribute_mapping: {
          user_id: 'nameId',
          email: 'email',
        },
        role_mapping: {
          role_claim: 'groups',
          mappings: {},
        },
        provisioning: {
          enabled: true,
          create_users: true,
          update_users: true,
          deactivate_on_remove: false,
          sync_roles: true,
        },
        created_at: new Date(),
        updated_at: new Date(),
      };

      const authUrl = samlService.buildAuthenticationUrl(
        mockConfig,
        'request123',
        'https://gateway.example.com/callback/saml',
        'state123'
      );

      expect(authUrl).toContain('https://okta.example.com/sso/saml');
      expect(authUrl).toContain('SAMLRequest=');
      expect(authUrl).toContain('RelayState=state123');
    });
  });
});
