/**
 * IdP Manager Service
 *
 * Main orchestration service for IdP federation operations.
 */
import { IdPType, IdPProvider, IdPError, IdPErrorCode, } from '../../types/idp';
import { OIDCFederationService } from './oidc';
import { SAMLFederationService } from './saml';
import { AttributeMappingService, RoleSynchronizationService } from './mapping';
import { JITProvisioningService } from './provisioning';
/**
 * IdP Manager Service
 */
export class IdPManagerService {
    oidcService;
    samlService;
    mappingService;
    roleService;
    provisioningService;
    constructor() {
        this.oidcService = new OIDCFederationService();
        this.samlService = new SAMLFederationService();
        this.mappingService = new AttributeMappingService();
        this.roleService = new RoleSynchronizationService();
        this.provisioningService = new JITProvisioningService();
    }
    /**
     * Initiate IdP authentication
     */
    async initiateAuthentication(config, request) {
        // Validate IdP is enabled
        if (!config.enabled) {
            throw new IdPError(IdPErrorCode.IDP_DISABLED, 'IdP is disabled');
        }
        // Build authentication URL based on IdP type
        switch (config.type) {
            case IdPType.OIDC:
                return this.oidcService.buildAuthorizationUrl(config, request);
            case IdPType.SAML:
                return this.samlService.buildAuthenticationUrl(config, request.state, request.redirect_uri, request.state);
            default:
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, `Unsupported IdP type: ${config.type}`);
        }
    }
    /**
     * Process IdP callback and authenticate user
     */
    async processCallback(config, params) {
        // Validate IdP is enabled
        if (!config.enabled) {
            throw new IdPError(IdPErrorCode.IDP_DISABLED, 'IdP is disabled');
        }
        let rawClaims;
        // Process callback based on IdP type
        switch (config.type) {
            case IdPType.OIDC:
                if (!params.code || !params.redirectUri) {
                    throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC callback requires code and redirectUri');
                }
                rawClaims = await this.oidcService.processCallback(config, params.code, params.redirectUri, params.state || '', params.nonce, params.codeVerifier);
                // Extract provider-specific claims
                rawClaims = this.oidcService.extractProviderClaims(config.provider, rawClaims);
                break;
            case IdPType.SAML:
                if (!params.samlResponse) {
                    throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'SAML callback requires samlResponse');
                }
                rawClaims = await this.samlService.processCallback(config, params.samlResponse, params.state);
                break;
            default:
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, `Unsupported IdP type: ${config.type}`);
        }
        // Map attributes to local user format
        const mappedAttributes = this.mappingService.mapAttributes(config, rawClaims);
        // Map roles
        const mappedRoles = this.mappingService.mapRoles(config, rawClaims);
        // Validate user eligibility
        const eligibility = this.provisioningService.validateUserEligibility(config, mappedAttributes);
        if (!eligibility.eligible) {
            throw new IdPError(IdPErrorCode.PROVISIONING_FAILED, `User not eligible for provisioning: ${eligibility.reason}`);
        }
        // Provision or update user
        const provisioningResult = await this.provisioningService.provisionUser(config, mappedAttributes);
        // Sync roles if enabled
        if (config.provisioning.sync_roles) {
            await this.roleService.synchronizeRoles(config.tenant_id, provisioningResult.user_id, mappedRoles, config);
        }
        // Build complete auth response
        return this.mappingService.buildAuthResponse(config, rawClaims, provisioningResult.user_id, provisioningResult.is_new_user);
    }
    /**
     * Get IdP configuration by ID
     */
    async getIdPConfig(tenantId, idpId) {
        // In production, fetch from database
        throw new IdPError(IdPErrorCode.IDP_NOT_FOUND, 'IdP not found');
    }
    /**
     * List IdPs for tenant
     */
    async listIdPs(tenantId) {
        // In production, fetch from database
        return [];
    }
    /**
     * Create IdP configuration
     */
    async createIdPConfig(config) {
        // Validate configuration
        this.validateIdPConfig(config);
        const now = new Date();
        const fullConfig = {
            ...config,
            created_at: now,
            updated_at: now,
        };
        // In production, store in database
        return fullConfig;
    }
    /**
     * Update IdP configuration
     */
    async updateIdPConfig(tenantId, idpId, updates) {
        // Get existing config
        const existingConfig = await this.getIdPConfig(tenantId, idpId);
        // Merge updates
        const updatedConfig = {
            ...existingConfig,
            ...updates,
            updated_at: new Date(),
        };
        // Validate configuration
        this.validateIdPConfig(updatedConfig);
        // In production, update in database
        return updatedConfig;
    }
    /**
     * Delete IdP configuration
     */
    async deleteIdPConfig(tenantId, idpId) {
        // In production:
        // 1. Verify no active users are using this IdP
        // 2. Delete federated identities
        // 3. Delete configuration
        // 4. Log deletion event
    }
    /**
     * Validate IdP configuration
     */
    validateIdPConfig(config) {
        // Validate based on type
        if (config.type === IdPType.OIDC) {
            if (!config.oidc_config) {
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC configuration is required');
            }
            if (!config.oidc_config.issuer || !config.oidc_config.client_id) {
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC issuer and client_id are required');
            }
        }
        if (config.type === IdPType.SAML) {
            if (!config.saml_config) {
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'SAML configuration is required');
            }
            if (!config.saml_config.entity_id || !config.saml_config.sso_url) {
                throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'SAML entity_id and sso_url are required');
            }
        }
        // Validate attribute mapping
        if (!config.attribute_mapping?.user_id || !config.attribute_mapping?.email) {
            throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'Attribute mapping for user_id and email are required');
        }
    }
    /**
     * Test IdP connection
     */
    async testIdPConnection(config) {
        try {
            // Validate configuration first
            this.validateIdPConfig(config);
            // Test connection based on type
            if (config.type === IdPType.OIDC && config.oidc_config) {
                // Try to discover OIDC metadata
                const metadata = await this.oidcService.discoverConfiguration(config.oidc_config.issuer);
                return {
                    success: true,
                    message: 'Successfully connected to OIDC provider',
                    metadata,
                };
            }
            if (config.type === IdPType.SAML) {
                // For SAML, just validate configuration
                return {
                    success: true,
                    message: 'SAML configuration is valid',
                };
            }
            return {
                success: false,
                message: 'Unsupported IdP type',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get provider-specific default configuration
     */
    getProviderDefaults(provider) {
        switch (provider) {
            case IdPProvider.AUTH0:
                return {
                    type: IdPType.OIDC,
                    provider: IdPProvider.AUTH0,
                    oidc_config: {
                        issuer: '', // User must provide their Auth0 domain
                        client_id: '',
                        client_secret: '',
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
                        role_claim: 'https://your-app.com/roles',
                        mappings: {},
                    },
                    provisioning: {
                        enabled: true,
                        create_users: true,
                        update_users: true,
                        deactivate_on_remove: false,
                        sync_roles: true,
                    },
                };
            case IdPProvider.OKTA:
                return {
                    type: IdPType.OIDC,
                    provider: IdPProvider.OKTA,
                    oidc_config: {
                        issuer: '', // User must provide their Okta domain
                        client_id: '',
                        client_secret: '',
                        scopes: ['openid', 'profile', 'email', 'groups'],
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
                };
            case IdPProvider.MICROSOFT_ENTRA:
                return {
                    type: IdPType.OIDC,
                    provider: IdPProvider.MICROSOFT_ENTRA,
                    oidc_config: {
                        issuer: 'https://login.microsoftonline.com/{tenant-id}/v2.0',
                        client_id: '',
                        client_secret: '',
                        scopes: ['openid', 'profile', 'email', 'User.Read'],
                        response_type: 'code',
                    },
                    attribute_mapping: {
                        user_id: 'oid',
                        email: 'email',
                        name: 'name',
                        given_name: 'given_name',
                        family_name: 'family_name',
                        picture: 'picture',
                    },
                    role_mapping: {
                        role_claim: 'roles',
                        mappings: {},
                    },
                    provisioning: {
                        enabled: true,
                        create_users: true,
                        update_users: true,
                        deactivate_on_remove: false,
                        sync_roles: true,
                    },
                };
            default:
                return {
                    provisioning: {
                        enabled: true,
                        create_users: true,
                        update_users: true,
                        deactivate_on_remove: false,
                        sync_roles: true,
                    },
                };
        }
    }
}
