/**
 * Attribute Mapping and Role Synchronization Service
 *
 * Maps IdP attributes to local user attributes and synchronizes roles.
 */
import { IdPConfig, IdPAuthResponse } from '../../types/idp';
/**
 * Attribute Mapping Service
 */
export declare class AttributeMappingService {
    /**
     * Map IdP claims to local user attributes
     */
    mapAttributes(config: IdPConfig, claims: Record<string, any>): Partial<IdPAuthResponse>;
    /**
     * Extract attribute value from claims using dot notation or array notation
     */
    private extractAttribute;
    /**
     * Extract email verification status from claims
     */
    private extractEmailVerified;
    /**
     * Map roles from IdP claims
     */
    mapRoles(config: IdPConfig, claims: Record<string, any>): string[];
    /**
     * Extract roles from claims
     */
    private extractRoles;
    /**
     * Build complete IdP auth response with mapped attributes and roles
     */
    buildAuthResponse(config: IdPConfig, claims: Record<string, any>, userId: string, isNewUser: boolean): IdPAuthResponse;
}
/**
 * Role Synchronization Service
 */
export declare class RoleSynchronizationService {
    /**
     * Synchronize user roles with IdP roles
     */
    synchronizeRoles(tenantId: string, userId: string, idpRoles: string[], config: IdPConfig): Promise<{
        added: string[];
        removed: string[];
        unchanged: string[];
    }>;
    /**
     * Check if role sync is enabled
     */
    isSyncEnabled(config: IdPConfig): boolean;
    /**
     * Validate roles against allowed roles for tenant
     */
    validateRoles(roles: string[], allowedRoles: string[]): boolean;
    /**
     * Filter roles based on tenant permissions
     */
    filterRoles(roles: string[], allowedRoles: string[]): string[];
}
