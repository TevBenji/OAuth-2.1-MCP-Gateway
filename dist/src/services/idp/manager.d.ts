/**
 * IdP Manager Service
 *
 * Main orchestration service for IdP federation operations.
 */
import { IdPConfig, IdPProvider, IdPAuthRequest, IdPAuthResponse } from '../../types/idp';
/**
 * IdP Manager Service
 */
export declare class IdPManagerService {
    private oidcService;
    private samlService;
    private mappingService;
    private roleService;
    private provisioningService;
    constructor();
    /**
     * Initiate IdP authentication
     */
    initiateAuthentication(config: IdPConfig, request: IdPAuthRequest): Promise<string>;
    /**
     * Process IdP callback and authenticate user
     */
    processCallback(config: IdPConfig, params: {
        code?: string;
        state?: string;
        samlResponse?: string;
        redirectUri?: string;
        nonce?: string;
        codeVerifier?: string;
    }): Promise<IdPAuthResponse>;
    /**
     * Get IdP configuration by ID
     */
    getIdPConfig(tenantId: string, idpId: string): Promise<IdPConfig>;
    /**
     * List IdPs for tenant
     */
    listIdPs(tenantId: string): Promise<IdPConfig[]>;
    /**
     * Create IdP configuration
     */
    createIdPConfig(config: Omit<IdPConfig, 'created_at' | 'updated_at'>): Promise<IdPConfig>;
    /**
     * Update IdP configuration
     */
    updateIdPConfig(tenantId: string, idpId: string, updates: Partial<IdPConfig>): Promise<IdPConfig>;
    /**
     * Delete IdP configuration
     */
    deleteIdPConfig(tenantId: string, idpId: string): Promise<void>;
    /**
     * Validate IdP configuration
     */
    private validateIdPConfig;
    /**
     * Test IdP connection
     */
    testIdPConnection(config: IdPConfig): Promise<{
        success: boolean;
        message: string;
        metadata?: any;
    }>;
    /**
     * Get provider-specific default configuration
     */
    getProviderDefaults(provider: IdPProvider): Partial<IdPConfig>;
}
